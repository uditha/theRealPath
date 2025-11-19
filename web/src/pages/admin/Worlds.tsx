import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, World } from '../../services/admin.service';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Globe, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, ArrowUpDown } from 'lucide-react';

export default function WorldsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorld, setEditingWorld] = useState<World | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'theme'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: worlds, isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => adminService.getWorlds(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<World, 'id'>) => adminService.createWorld(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<World> }) =>
      adminService.updateWorld(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setEditingWorld(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteWorld(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Filter and sort worlds (MUST be before early returns)
  const filteredAndSortedWorlds = useMemo(() => {
    if (!worlds) return [];

    // Filter worlds
    let filtered = worlds.filter((world: World) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        world.nameEn.toLowerCase().includes(searchLower) ||
        world.nameSi.toLowerCase().includes(searchLower) ||
        world.themeKey.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a: World, b: World) => {
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
        case 'theme':
          aValue = a.themeKey.toLowerCase();
          bValue = b.themeKey.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [worlds, searchQuery, sortBy, sortOrder]);

  const handleSort = (column: 'order' | 'title' | 'theme') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Early return AFTER all hooks
  if (isLoading) {
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
            <h1 className="text-4xl font-bold tracking-tight">Worlds</h1>
            <p className="text-muted-foreground mt-2">
              Manage learning worlds and their settings ({filteredAndSortedWorlds.length} total)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create World
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search worlds by name or theme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Worlds Table */}
        {filteredAndSortedWorlds && filteredAndSortedWorlds.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">
                      <button
                        onClick={() => handleSort('order')}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                      >
                        Order
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                      >
                        Title
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <button
                        onClick={() => handleSort('theme')}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                      >
                        Theme
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">Background Image</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-right p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedWorlds.map((world: World) => (
                    <tr
                      key={world.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-medium">{world.orderIndex}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{world.nameEn}</div>
                          <div className="text-sm text-muted-foreground">{world.nameSi}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{world.themeKey}</span>
                      </td>
                      <td className="p-4">
                        {world.backgroundImageUrl ? (
                          <span className="text-xs text-green-600">✓ Has image</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                      </td>
                      <td className="p-4">
                        {world.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/worlds/${world.id}/chapters`}>
                            <Button variant="ghost" size="sm">
                              <Globe className="mr-2 h-4 w-4" />
                              Chapters
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingWorld(world)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this world?')) {
                                deleteMutation.mutate(world.id);
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
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No worlds found' : 'No worlds yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first learning world'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create World
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Modal */}
        <Dialog
          open={showCreateModal || !!editingWorld}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateModal(false);
              setEditingWorld(null);
            }
          }}
        >
          <DialogContent onClose={() => {
            setShowCreateModal(false);
            setEditingWorld(null);
          }}>
            <DialogHeader>
              <DialogTitle>{editingWorld ? 'Edit World' : 'Create World'}</DialogTitle>
            </DialogHeader>
            <WorldModal
              world={editingWorld || undefined}
              onClose={() => {
                setShowCreateModal(false);
                setEditingWorld(null);
              }}
              onSave={(data) => {
                if (editingWorld) {
                  updateMutation.mutate({ id: editingWorld.id, data });
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


function WorldModal({
  world,
  onClose,
  onSave,
  isLoading,
}: {
  world?: World;
  onClose: () => void;
  onSave: (data: Omit<World, 'id'>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    nameEn: world?.nameEn || '',
    nameSi: world?.nameSi || '',
    orderIndex: world?.orderIndex || 0,
    themeKey: world?.themeKey || 'default',
    backgroundImageUrl: world?.backgroundImageUrl || '',
    isActive: world?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert empty string to null for backgroundImageUrl
    const dataToSave = {
      ...formData,
      backgroundImageUrl: formData.backgroundImageUrl?.trim() || null,
    };
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderIndex">Order Index</Label>
          <Input
            id="orderIndex"
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="themeKey">Theme Key</Label>
          <Input
            id="themeKey"
            value={formData.themeKey}
            onChange={(e) => setFormData({ ...formData, themeKey: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="backgroundImageUrl">Background Image URL</Label>
        <Input
          id="backgroundImageUrl"
          type="url"
          value={formData.backgroundImageUrl}
          onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })}
          placeholder="https://example.com/world-background.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Optional: URL to a background image for this world. If not provided, gradient colors will be used.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active
        </Label>
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
