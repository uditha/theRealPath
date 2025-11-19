import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Chapter, World } from '../../services/admin.service';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { BookOpen, Plus, Edit2, Trash2, ArrowRight, Search, ArrowUpDown } from 'lucide-react';

export default function ChaptersPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'world'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: worlds, isLoading: worldsLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => adminService.getWorlds(),
  });

  // Fetch chapters with world context
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn: async () => {
      // Get worlds which include chapters
      const worldsData = await adminService.getWorlds();
      // Flatten chapters but preserve worldId
      const chaptersWithWorld = worldsData.flatMap((world: any) =>
        (world.chapters || []).map((chapter: any) => ({
          ...chapter,
          worldId: world.id,
        }))
      );
      return chaptersWithWorld;
    },
    enabled: !!worlds,
  });

  const chapters = chaptersData;

  const createMutation = useMutation({
    mutationFn: (data: Omit<Chapter, 'id'>) => adminService.createChapter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Chapter> }) =>
      adminService.updateChapter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setEditingChapter(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteChapter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Helper functions (must be defined before useMemo)
  const getWorldName = (worldId: string) => {
    const world = worlds?.find((w: World) => w.id === worldId);
    return world ? world.nameEn : worldId;
  };

  const getWorldNameSi = (worldId: string) => {
    const world = worlds?.find((w: World) => w.id === worldId);
    return world ? world.nameSi : '';
  };

  // Group and filter chapters by world (MUST be before early returns)
  const groupedChapters = useMemo(() => {
    if (!chapters || !worlds) return [];

    // Filter chapters
    let filtered = chapters.filter((chapter: any) => {
      const searchLower = searchQuery.toLowerCase();
      const worldName = getWorldName(chapter.worldId).toLowerCase();
      return (
        chapter.nameEn.toLowerCase().includes(searchLower) ||
        chapter.nameSi.toLowerCase().includes(searchLower) ||
        worldName.includes(searchLower)
      );
    });

    // Group by world
    const grouped: { world: World; chapters: any[] }[] = [];
    const worldMap = new Map<string, World>();
    
    worlds.forEach((world: World) => {
      worldMap.set(world.id, world);
    });

    // Create groups for worlds that have filtered chapters
    filtered.forEach((chapter: any) => {
      const world = worldMap.get(chapter.worldId);
      if (!world) return;

      let group = grouped.find((g) => g.world.id === world.id);
      if (!group) {
        group = { world, chapters: [] };
        grouped.push(group);
      }
      group.chapters.push(chapter);
    });

    // Sort worlds by orderIndex
    grouped.sort((a, b) => a.world.orderIndex - b.world.orderIndex);

    // Sort chapters within each world
    grouped.forEach((group) => {
      group.chapters.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'order':
            aValue = a.orderIndex;
            bValue = b.orderIndex;
            break;
          case 'title':
            aValue = a.nameEn.toLowerCase();
            bValue = b.nameEn.toLowerCase();
            break;
          default:
            aValue = a.orderIndex;
            bValue = b.orderIndex;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    });

    return grouped;
  }, [chapters, searchQuery, sortBy, sortOrder, worlds]);

  const handleSort = (column: 'order' | 'title' | 'world') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Early return AFTER all hooks
  if (chaptersLoading || worldsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Chapters</h1>
            <p className="text-muted-foreground mt-2">
              Manage chapters within learning worlds ({chapters?.length || 0} total)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Chapter
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chapters by name or world..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Chapters Table - Grouped by World */}
        {groupedChapters && groupedChapters.length > 0 ? (
          <div className="space-y-6">
            {groupedChapters.map((group) => (
              <Card key={group.world.id}>
                {/* World Header */}
                <div className="bg-muted/50 border-b p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{group.world.nameEn}</h3>
                      <p className="text-sm text-muted-foreground">{group.world.nameSi}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {group.chapters.length} chapter{group.chapters.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Chapters Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-4 font-semibold text-sm">
                          <button
                            onClick={() => handleSort('order')}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            Order
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">
                          <button
                            onClick={() => handleSort('title')}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            Title
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.chapters.map((chapter: any) => (
                        <tr
                          key={chapter.id}
                          className="border-b hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-medium text-sm">{chapter.orderIndex}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{chapter.nameEn}</div>
                              <div className="text-sm text-muted-foreground">{chapter.nameSi}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Link to={`/admin/chapters/${chapter.id}/lessons`}>
                                <Button variant="ghost" size="sm">
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Lessons
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingChapter(chapter)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this chapter?')) {
                                    deleteMutation.mutate(chapter.id);
                                  }
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No chapters found' : 'No chapters yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first chapter'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Chapter
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Modal */}
        <Dialog
          open={showCreateModal || !!editingChapter}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateModal(false);
              setEditingChapter(null);
            }
          }}
        >
          <DialogContent onClose={() => {
            setShowCreateModal(false);
            setEditingChapter(null);
          }}>
            <DialogHeader>
              <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Create Chapter'}</DialogTitle>
            </DialogHeader>
            <ChapterModal
              chapter={editingChapter || undefined}
              worlds={worlds || []}
              onClose={() => {
                setShowCreateModal(false);
                setEditingChapter(null);
              }}
              onSave={(data) => {
                if (editingChapter) {
                  updateMutation.mutate({ id: editingChapter.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


function ChapterModal({
  chapter,
  worlds,
  onClose,
  onSave,
  isLoading,
}: {
  chapter?: Chapter;
  worlds: World[];
  onClose: () => void;
  onSave: (data: Omit<Chapter, 'id'>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    worldId: chapter?.worldId || worlds[0]?.id || '',
    nameEn: chapter?.nameEn || '',
    nameSi: chapter?.nameSi || '',
    orderIndex: chapter?.orderIndex || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="worldId">World</Label>
        <Select
          id="worldId"
          value={formData.worldId}
          onChange={(e) => setFormData({ ...formData, worldId: e.target.value })}
          required
        >
          <option value="">Select a world</option>
          {worlds.map((world) => (
            <option key={world.id} value={world.id}>
              {world.nameEn} / {world.nameSi}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nameEn">Name (English)</Label>
        <Input
          id="nameEn"
          value={formData.nameEn}
          onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nameSi">Name (Sinhala)</Label>
        <Input
          id="nameSi"
          value={formData.nameSi}
          onChange={(e) => setFormData({ ...formData, nameSi: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="orderIndex">Order Index</Label>
        <Input
          id="orderIndex"
          type="number"
          value={formData.orderIndex}
          onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
