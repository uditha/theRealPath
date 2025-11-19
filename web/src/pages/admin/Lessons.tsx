import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Lesson, Chapter } from '../../services/admin.service';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GraduationCap, Plus, Edit2, Trash2, ArrowUpDown, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useState, useMemo } from 'react';

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'chapter' | 'xp'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
  });

  const chapters = chaptersData;

  const { data: worlds } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => adminService.getWorlds(),
  });

  // Get lessons for all chapters
  const { data: allLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['allLessons'],
    queryFn: async () => {
      if (!chapters) return [];
      const lessonsPromises = chapters.map((chapter: Chapter) =>
        adminService.getLessonsByChapter(chapter.id).catch(() => [])
      );
      const lessonsArrays = await Promise.all(lessonsPromises);
      return lessonsArrays.flat();
    },
    enabled: !!chapters,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLessons'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const getChapterName = (chapterId: string) => {
    const chapter = chapters?.find((c: Chapter) => c.id === chapterId);
    return chapter ? chapter.nameEn : chapterId;
  };

  const getWorldName = (chapterId: string) => {
    const chapter = chapters?.find((c: any) => c.id === chapterId);
    if (chapter && (chapter as any).worldId && worlds) {
      const world = worlds.find((w: any) => w.id === (chapter as any).worldId);
      return world ? world.nameEn : '';
    }
    return '';
  };

  const getChapterWorldId = (chapterId: string) => {
    const chapter = chapters?.find((c: any) => c.id === chapterId);
    return (chapter as any)?.worldId;
  };

  // Group and filter lessons by chapter
  const groupedLessons = useMemo(() => {
    if (!allLessons || !chapters) return [];

    // Filter lessons
    let filtered = allLessons.filter((lesson: Lesson) => {
      const searchLower = searchQuery.toLowerCase();
      const chapterName = getChapterName(lesson.chapterId).toLowerCase();
      return (
        lesson.titleEn.toLowerCase().includes(searchLower) ||
        lesson.titleSi.toLowerCase().includes(searchLower) ||
        chapterName.includes(searchLower)
      );
    });

    // Group by chapter
    const grouped: { chapter: Chapter; lessons: Lesson[] }[] = [];
    const chapterMap = new Map<string, Chapter>();
    
    chapters.forEach((chapter: Chapter) => {
      chapterMap.set(chapter.id, chapter);
    });

    // Create groups for chapters that have filtered lessons
    filtered.forEach((lesson: Lesson) => {
      const chapter = chapterMap.get(lesson.chapterId);
      if (!chapter) return;

      let group = grouped.find((g) => g.chapter.id === chapter.id);
      if (!group) {
        group = { chapter, lessons: [] };
        grouped.push(group);
      }
      group.lessons.push(lesson);
    });

    // Sort chapters by orderIndex
    grouped.sort((a, b) => {
      // First sort by world order (if available)
      const aWorldId = getChapterWorldId(a.chapter.id);
      const bWorldId = getChapterWorldId(b.chapter.id);
      
      if (aWorldId && bWorldId && worlds) {
        const aWorld = worlds.find((w: any) => w.id === aWorldId);
        const bWorld = worlds.find((w: any) => w.id === bWorldId);
        
        if (aWorld && bWorld && aWorld.orderIndex !== bWorld.orderIndex) {
          return aWorld.orderIndex - bWorld.orderIndex;
        }
      }
      
      // Then by chapter order
      return a.chapter.orderIndex - b.chapter.orderIndex;
    });

    // Sort lessons within each chapter
    grouped.forEach((group) => {
      group.lessons.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'order':
            aValue = a.orderIndex;
            bValue = b.orderIndex;
            break;
          case 'title':
            aValue = a.titleEn.toLowerCase();
            bValue = b.titleEn.toLowerCase();
            break;
          case 'xp':
            aValue = a.xpReward;
            bValue = b.xpReward;
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
  }, [allLessons, searchQuery, sortBy, sortOrder, chapters, worlds]);

  const handleSort = (column: 'order' | 'title' | 'chapter' | 'xp') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (chaptersLoading || lessonsLoading) {
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
            <h1 className="text-4xl font-bold tracking-tight">Lessons</h1>
            <p className="text-muted-foreground mt-2">
              Manage lessons and their content ({allLessons?.length || 0} total)
            </p>
          </div>
          <Link to="/admin/lessons/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Lesson
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons by title or chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lessons Table - Grouped by Chapter */}
        {groupedLessons && groupedLessons.length > 0 ? (
          <div className="space-y-6">
            {groupedLessons.map((group) => (
              <Card key={group.chapter.id}>
                {/* Chapter Header */}
                <div className="bg-muted/50 border-b p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{group.chapter.nameEn}</h3>
                      <p className="text-sm text-muted-foreground">{group.chapter.nameSi}</p>
                      {getWorldName(group.chapter.id) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          World: {getWorldName(group.chapter.id)}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {group.lessons.length} lesson{group.lessons.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Lessons Table */}
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
                        <th className="text-left p-4 font-semibold text-sm">
                          <button
                            onClick={() => handleSort('xp')}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            XP
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">Slides</th>
                        <th className="text-left p-4 font-semibold text-sm">Questions</th>
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                        <th className="text-right p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.lessons.map((lesson: Lesson) => (
                        <tr
                          key={lesson.id}
                          className="border-b hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-medium text-sm">{lesson.orderIndex}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{lesson.titleEn}</div>
                              <div className="text-sm text-muted-foreground">{lesson.titleSi}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-primary text-sm">{lesson.xpReward} XP</span>
                          </td>
                          <td className="p-4">
                            <span className="text-muted-foreground text-sm">
                              {lesson.slides?.length || 0}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-muted-foreground text-sm">
                              {lesson.questions?.length || 0}
                            </span>
                          </td>
                          <td className="p-4">
                            {lesson.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/admin/lessons/${lesson.id}/edit`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this lesson?')) {
                                    deleteMutation.mutate(lesson.id);
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
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No lessons found' : 'No lessons yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first lesson'}
              </p>
              {!searchQuery && (
                <Link to="/admin/lessons/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Lesson
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

