import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Chapter, World } from '../../services/admin.service';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BookOpen, ArrowLeft, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useState, useMemo } from 'react';

export default function WorldChaptersPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch world details
  const { data: world, isLoading: worldLoading } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      if (!worldId) return null;
      const worlds = await adminService.getWorlds();
      return worlds.find((w: World) => w.id === worldId) || null;
    },
    enabled: !!worldId,
  });

  // Get chapters from world data
  const chapters = world?.chapters || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteChapter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world', worldId] });
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Filter chapters based on search
  const filteredChapters = useMemo(() => {
    if (!chapters) return [];
    if (!searchQuery) return chapters;

    const searchLower = searchQuery.toLowerCase();
    return chapters.filter((chapter: Chapter) =>
      chapter.nameEn.toLowerCase().includes(searchLower) ||
      chapter.nameSi.toLowerCase().includes(searchLower)
    );
  }, [chapters, searchQuery]);

  // Sort chapters by orderIndex
  const sortedChapters = useMemo(() => {
    return [...filteredChapters].sort((a, b) => {
      const aIndex = a.orderIndex ?? 0;
      const bIndex = b.orderIndex ?? 0;
      return aIndex - bIndex;
    });
  }, [filteredChapters]);

  if (worldLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!world) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">World not found</p>
            <Button onClick={() => navigate('/admin/worlds')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worlds
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/worlds')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">World Chapters</h1>
              <p className="text-muted-foreground">
                {world.nameEn} ({world.nameSi})
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Theme: {world.themeKey}
              </p>
            </div>
          </div>
          <Link to={`/admin/chapters?worldId=${worldId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {sortedChapters.length} chapter{sortedChapters.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Chapters List */}
        {sortedChapters.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Order</th>
                      <th className="text-left p-4 font-semibold">Title (EN)</th>
                      <th className="text-left p-4 font-semibold">Title (SI)</th>
                      <th className="text-left p-4 font-semibold">Lessons</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedChapters.map((chapter: Chapter) => (
                      <tr key={chapter.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <span className="font-mono text-sm">{chapter.orderIndex ?? 0}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{chapter.nameEn}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-muted-foreground">{chapter.nameSi}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {(chapter as any).lessonCount ?? 0} lesson{(chapter as any).lessonCount !== 1 ? 's' : ''}
                          </span>
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
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this chapter?')) {
                                  deleteMutation.mutate(chapter.id);
                                }
                              }}
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
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No chapters found matching your search.' : 'No chapters in this world yet.'}
              </p>
              {!searchQuery && (
                <Link to={`/admin/chapters?worldId=${worldId}`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Chapter
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}








