import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Lesson, Chapter } from '../../services/admin.service';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GraduationCap, ArrowLeft, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useState, useMemo } from 'react';

export default function ChapterLessonsPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chapter details
  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      if (!chapterId) return null;
      const worlds = await adminService.getWorlds();
      for (const world of worlds) {
        const chapter = world.chapters?.find((c: Chapter) => c.id === chapterId);
        if (chapter) {
          return { ...chapter, worldId: world.id, worldName: world.nameEn };
        }
      }
      return null;
    },
    enabled: !!chapterId,
  });

  // Fetch lessons for this chapter
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', chapterId],
    queryFn: () => adminService.getLessonsByChapter(chapterId!),
    enabled: !!chapterId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
      queryClient.invalidateQueries({ queryKey: ['allLessons'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Filter lessons based on search
  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    if (!searchQuery) return lessons;

    const searchLower = searchQuery.toLowerCase();
    return lessons.filter((lesson: Lesson) =>
      lesson.titleEn.toLowerCase().includes(searchLower) ||
      lesson.titleSi.toLowerCase().includes(searchLower)
    );
  }, [lessons, searchQuery]);

  // Sort lessons by orderIndex
  const sortedLessons = useMemo(() => {
    return [...filteredLessons].sort((a, b) => {
      const aIndex = a.orderIndex ?? 0;
      const bIndex = b.orderIndex ?? 0;
      return aIndex - bIndex;
    });
  }, [filteredLessons]);

  if (chapterLoading || lessonsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!chapter) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Chapter not found</p>
            <Button onClick={() => navigate('/admin/chapters')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chapters
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
              onClick={() => navigate('/admin/chapters')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chapter Lessons</h1>
              <p className="text-muted-foreground">
                {chapter.nameEn} ({chapter.nameSi})
              </p>
              {chapter.worldName && (
                <p className="text-sm text-muted-foreground mt-1">
                  World: {chapter.worldName}
                </p>
              )}
            </div>
          </div>
          <Link to={`/admin/lessons/new?chapterId=${chapterId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lessons List */}
        {sortedLessons.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Order</th>
                      <th className="text-left p-4 font-semibold">Title (EN)</th>
                      <th className="text-left p-4 font-semibold">Title (SI)</th>
                      <th className="text-left p-4 font-semibold">XP</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLessons.map((lesson: Lesson) => (
                      <tr key={lesson.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <span className="font-mono text-sm">{lesson.orderIndex ?? 0}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{lesson.titleEn}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-muted-foreground">{lesson.titleSi}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{lesson.xpReward ?? 0} XP</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              lesson.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {lesson.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/lessons/${lesson.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this lesson?')) {
                                  deleteMutation.mutate(lesson.id);
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
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No lessons found matching your search.' : 'No lessons in this chapter yet.'}
              </p>
              {!searchQuery && (
                <Link to={`/admin/lessons/new?chapterId=${chapterId}`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Lesson
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








