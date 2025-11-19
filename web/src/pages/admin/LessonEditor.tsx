import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Lesson, Chapter, Slide, Question, ReflectionQuestion } from '../../services/admin.service';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { ArrowLeft, Plus, Trash2, FileText, HelpCircle, Brain } from 'lucide-react';

export default function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const isNew = id === 'new';
  const chapterIdFromQuery = searchParams.get('chapterId');

  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => adminService.getChapters(),
  });

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => adminService.getLesson(id!),
    enabled: !isNew && !!id,
  });

  const [formData, setFormData] = useState<Partial<Lesson>>({
    chapterId: '',
    titleEn: '',
    titleSi: '',
    orderIndex: 0,
    xpReward: 10,
    isActive: true,
    slides: [],
    questions: [],
    reflectionQuestions: [],
  });

  useEffect(() => {
    if (lesson) {
      // Transform lesson data to match our form structure
      const slides = lesson.slides?.map((slide: any) => ({
        orderIndex: slide.id || slide.orderIndex,
        type: slide.type,
        text: slide.text || { en: '', si: '' },
        image: slide.image || null,
        videoUrlEn: slide.videoUrlEn || null,
        videoUrlSi: slide.videoUrlSi || null,
      })) || [];

      const questions = lesson.quiz?.map((q: any) => {
        const question: Question = {
          orderIndex: q.id || q.orderIndex,
          type: q.type,
          question: q.question || { en: '', si: '' },
        };

        if (q.type === 'single_choice' || q.type === 'multi_select') {
          question.options = q.options || { en: [''], si: [''] };
          if (q.type === 'single_choice') {
            question.correct_index = q.correct_index ?? 0;
          } else {
            question.correct_indices = q.correct_indices || [];
          }
        } else if (q.type === 'true_false') {
          question.answer = q.answer?.en ?? q.answer ?? false;
        }

        return question;
      }) || [];

      // Load reflection questions
      const reflectionQuestions = lesson.reflectionQuestions?.map((rq: any) => ({
        category: rq.category || 'general',
        prompt: {
          en: rq.promptEn || rq.prompt?.en || '',
          si: rq.promptSi || rq.prompt?.si || '',
        },
        options: {
          en: rq.optionsEn || rq.options?.en || [],
          si: rq.optionsSi || rq.options?.si || [],
        },
        orderIndex: rq.orderIndex || 0,
        isActive: rq.isActive !== undefined ? rq.isActive : true,
      })) || [];

      setFormData({
        chapterId: lesson.chapter_id || '',
        titleEn: lesson.title?.en || lesson.titleEn || '',
        titleSi: lesson.title?.si || lesson.titleSi || '',
        orderIndex: 0,
        xpReward: lesson.rewards?.xp || 10,
        isActive: true,
        slides,
        questions,
        reflectionQuestions,
      });
    } else if (chapters && chapters.length > 0) {
      setFormData((prev) => ({
        ...prev,
        chapterId: prev.chapterId || chapterIdFromQuery || chapters[0].id,
      }));
    }
  }, [lesson, chapters, chapterIdFromQuery]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<Lesson, 'id'>) => adminService.createLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterIdFromQuery] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      // Redirect back to chapter lessons page if chapterId was provided, otherwise to lessons list
      if (chapterIdFromQuery) {
        navigate(`/admin/chapters/${chapterIdFromQuery}/lessons`);
      } else {
        navigate('/admin/lessons');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lesson> }) =>
      adminService.updateLesson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterIdFromQuery] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      // Redirect back to chapter lessons page if chapterId was provided, otherwise to lessons list
      if (chapterIdFromQuery) {
        navigate(`/admin/chapters/${chapterIdFromQuery}/lessons`);
      } else {
        navigate('/admin/lessons');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure slides have proper image field handling
    const processedSlides = (formData.slides || []).map((slide: any) => ({
      ...slide,
      image: slide.image && slide.image.trim() !== '' ? slide.image.trim() : null,
      videoUrlEn: slide.videoUrlEn && slide.videoUrlEn.trim() !== '' ? slide.videoUrlEn.trim() : null,
      videoUrlSi: slide.videoUrlSi && slide.videoUrlSi.trim() !== '' ? slide.videoUrlSi.trim() : null,
    }));
    
    const data = {
      chapterId: formData.chapterId!,
      titleEn: formData.titleEn!,
      titleSi: formData.titleSi!,
      orderIndex: formData.orderIndex || 0,
      xpReward: formData.xpReward || 10,
      isActive: formData.isActive ?? true,
      slides: processedSlides,
      questions: formData.questions || [],
      reflectionQuestions: formData.reflectionQuestions || [],
    };

    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: id!, data });
    }
  };

  const addSlide = () => {
    setFormData({
      ...formData,
      slides: [
        ...(formData.slides || []),
        {
          orderIndex: (formData.slides?.length || 0) + 1,
          type: 'explanation',
          text: { en: '', si: '' },
          image: null,
          videoUrlEn: null,
          videoUrlSi: null,
        },
      ],
    });
  };

  const updateSlide = (index: number, slide: Slide) => {
    const slides = [...(formData.slides || [])];
    slides[index] = slide;
    setFormData({ ...formData, slides });
  };

  const deleteSlide = (index: number) => {
    const slides = (formData.slides || []).filter((_, i) => i !== index);
    setFormData({ ...formData, slides });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...(formData.questions || []),
        {
          orderIndex: (formData.questions?.length || 0) + 1,
          type: 'single_choice',
          question: { en: '', si: '' },
          options: { en: [''], si: [''] },
          correct_index: 0,
        },
      ],
    });
  };

  const updateQuestion = (index: number, question: Question) => {
    const questions = [...(formData.questions || [])];
    questions[index] = question;
    setFormData({ ...formData, questions });
  };

  const deleteQuestion = (index: number) => {
    const questions = (formData.questions || []).filter((_, i) => i !== index);
    setFormData({ ...formData, questions });
  };

  const addReflectionQuestion = () => {
    setFormData({
      ...formData,
      reflectionQuestions: [
        ...(formData.reflectionQuestions || []),
        {
          category: 'general',
          prompt: { en: '', si: '' },
          options: { en: [''], si: [''] },
          orderIndex: (formData.reflectionQuestions?.length || 0),
          isActive: true,
        },
      ],
    });
  };

  const updateReflectionQuestion = (index: number, reflectionQuestion: ReflectionQuestion) => {
    const reflectionQuestions = [...(formData.reflectionQuestions || [])];
    reflectionQuestions[index] = reflectionQuestion;
    setFormData({ ...formData, reflectionQuestions });
  };

  const deleteReflectionQuestion = (index: number) => {
    const reflectionQuestions = (formData.reflectionQuestions || []).filter((_, i) => i !== index);
    setFormData({ ...formData, reflectionQuestions });
  };

  if (chaptersLoading || (lessonLoading && !isNew)) {
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
            <h1 className="text-4xl font-bold tracking-tight">
              {isNew ? 'Create Lesson' : 'Edit Lesson'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isNew ? 'Add a new lesson with slides and quiz questions' : 'Update lesson content'}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/lessons')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set up the lesson details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapterId">Chapter</Label>
                  <Select
                    id="chapterId"
                    value={formData.chapterId}
                    onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                    required
                  >
                    <option value="">Select a chapter</option>
                    {chapters?.map((chapter: Chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.nameEn} / {chapter.nameSi}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderIndex">Order Index</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) =>
                      setFormData({ ...formData, orderIndex: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleEn">Title (English)</Label>
                  <Input
                    id="titleEn"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleSi">Title (Sinhala)</Label>
                  <Input
                    id="titleSi"
                    value={formData.titleSi}
                    onChange={(e) => setFormData({ ...formData, titleSi: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xpReward">XP Reward</Label>
                  <Input
                    id="xpReward"
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) =>
                      setFormData({ ...formData, xpReward: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slides */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Slides ({formData.slides?.length || 0})</CardTitle>
                  <CardDescription>Add content slides for the lesson</CardDescription>
                </div>
                <Button type="button" onClick={addSlide} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slide
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.slides?.map((slide, index) => (
                  <SlideEditor
                    key={index}
                    slide={slide}
                    index={index}
                    onUpdate={(updatedSlide) => updateSlide(index, updatedSlide)}
                    onDelete={() => deleteSlide(index)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quiz Questions ({formData.questions?.length || 0})</CardTitle>
                  <CardDescription>Add quiz questions to test comprehension</CardDescription>
                </div>
                <Button type="button" onClick={addQuestion} size="sm" variant="secondary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.questions?.map((question, index) => (
                  <QuestionEditor
                    key={index}
                    question={question}
                    index={index}
                    onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                    onDelete={() => deleteQuestion(index)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reflection Questions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Reflection Questions ({formData.reflectionQuestions?.length || 0})</CardTitle>
                  <CardDescription>
                    Add reflection questions shown after quiz completion. Questions are selected based on user's quiz score:
                    <br />
                    • <strong>General</strong>: Default for all users
                    <br />
                    • <strong>Challenging</strong>: Shown when score &lt; 60%
                    <br />
                    • <strong>Success</strong>: Shown when score ≥ 80%
                  </CardDescription>
                </div>
                <Button type="button" onClick={addReflectionQuestion} size="sm" variant="secondary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Reflection Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.reflectionQuestions?.map((reflectionQuestion, index) => (
                  <ReflectionQuestionEditor
                    key={index}
                    reflectionQuestion={reflectionQuestion}
                    index={index}
                    onUpdate={(updatedReflectionQuestion) => updateReflectionQuestion(index, updatedReflectionQuestion)}
                    onDelete={() => deleteReflectionQuestion(index)}
                  />
                ))}
                {(!formData.reflectionQuestions || formData.reflectionQuestions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reflection questions added yet. Add one to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/lessons')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isNew
                ? 'Create Lesson'
                : 'Update Lesson'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function SlideEditor({
  slide,
  index,
  onUpdate,
  onDelete,
}: {
  slide: Slide;
  index: number;
  onUpdate: (slide: Slide) => void;
  onDelete: () => void;
}) {
  const [localSlide, setLocalSlide] = useState<Slide>(slide);

  // Update local slide when prop changes (e.g., when lesson data is loaded)
  useEffect(() => {
    setLocalSlide(slide);
  }, [slide]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localSlide, [field]: value };
    setLocalSlide(updated);
    onUpdate(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Slide {index + 1}</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={localSlide.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="explanation">Explanation</option>
              <option value="story">Story</option>
              <option value="summary">Summary</option>
              <option value="example">Example</option>
              <option value="reflection">Reflection</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Index</Label>
            <Input
              type="number"
              value={localSlide.orderIndex}
              onChange={(e) => handleChange('orderIndex', parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Text (English)</Label>
            <Textarea
              value={localSlide.text.en}
              onChange={(e) =>
                handleChange('text', { ...localSlide.text, en: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Text (Sinhala)</Label>
            <Textarea
              value={localSlide.text.si}
              onChange={(e) =>
                handleChange('text', { ...localSlide.text, si: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              type="text"
              value={localSlide.image || ''}
              onChange={(e) => handleChange('image', e.target.value || null)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Video URL (English)</Label>
            <Input
              type="text"
              value={localSlide.videoUrlEn || ''}
              onChange={(e) => handleChange('videoUrlEn', e.target.value || null)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Video URL (Sinhala)</Label>
            <Input
              type="text"
              value={localSlide.videoUrlSi || ''}
              onChange={(e) => handleChange('videoUrlSi', e.target.value || null)}
              placeholder="https://..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}) {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onUpdate(updated);
  };

  const addOption = () => {
    const options = localQuestion.options || { en: [''], si: [''] };
    handleChange('options', {
      en: [...options.en, ''],
      si: [...options.si, ''],
    });
  };

  const updateOption = (lang: 'en' | 'si', optionIndex: number, value: string) => {
    const options = localQuestion.options || { en: [''], si: [''] };
    const newOptions = { ...options };
    newOptions[lang][optionIndex] = value;
    handleChange('options', newOptions);
  };

  const removeOption = (optionIndex: number) => {
    const options = localQuestion.options || { en: [''], si: [''] };
    handleChange('options', {
      en: options.en.filter((_, i) => i !== optionIndex),
      si: options.si.filter((_, i) => i !== optionIndex),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={localQuestion.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="single_choice">Single Choice</option>
              <option value="multi_select">Multiple Select</option>
              <option value="true_false">True/False</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Question (English)</Label>
            <Textarea
              value={localQuestion.question.en}
              onChange={(e) =>
                handleChange('question', { ...localQuestion.question, en: e.target.value })
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Question (Sinhala)</Label>
            <Textarea
              value={localQuestion.question.si}
              onChange={(e) =>
                handleChange('question', { ...localQuestion.question, si: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Options for single_choice and multi_select */}
          {(localQuestion.type === 'single_choice' || localQuestion.type === 'multi_select') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Options</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {localQuestion.options?.en.map((option, optIndex) => (
                  <div key={optIndex} className="flex gap-2">
                    <Input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption('en', optIndex, e.target.value)}
                      placeholder="English option"
                      className="flex-1"
                    />
                    <Input
                      type="text"
                      value={localQuestion.options?.si[optIndex] || ''}
                      onChange={(e) => updateOption('si', optIndex, e.target.value)}
                      placeholder="Sinhala option"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>
                  {localQuestion.type === 'single_choice' ? 'Correct Index' : 'Correct Indices (comma-separated)'}
                </Label>
                <Input
                  type="text"
                  value={
                    localQuestion.type === 'single_choice'
                      ? localQuestion.correct_index ?? 0
                      : localQuestion.correct_indices?.join(',') || ''
                  }
                  onChange={(e) => {
                    if (localQuestion.type === 'single_choice') {
                      handleChange('correct_index', parseInt(e.target.value) || 0);
                    } else {
                      handleChange(
                        'correct_indices',
                        e.target.value.split(',').map((v) => parseInt(v.trim())).filter((v) => !isNaN(v))
                      );
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Answer for true_false */}
          {localQuestion.type === 'true_false' && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select
                value={localQuestion.answer ? 'true' : 'false'}
                onChange={(e) => handleChange('answer', e.target.value === 'true')}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReflectionQuestionEditor({
  reflectionQuestion,
  index,
  onUpdate,
  onDelete,
}: {
  reflectionQuestion: ReflectionQuestion;
  index: number;
  onUpdate: (reflectionQuestion: ReflectionQuestion) => void;
  onDelete: () => void;
}) {
  const [localReflectionQuestion, setLocalReflectionQuestion] = useState<ReflectionQuestion>(reflectionQuestion);

  useEffect(() => {
    setLocalReflectionQuestion(reflectionQuestion);
  }, [reflectionQuestion]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localReflectionQuestion, [field]: value };
    setLocalReflectionQuestion(updated);
    onUpdate(updated);
  };

  const addOption = () => {
    const options = localReflectionQuestion.options || { en: [''], si: [''] };
    handleChange('options', {
      en: [...options.en, ''],
      si: [...options.si, ''],
    });
  };

  const updateOption = (lang: 'en' | 'si', optionIndex: number, value: string) => {
    const options = localReflectionQuestion.options || { en: [''], si: [''] };
    const newOptions = { ...options };
    newOptions[lang][optionIndex] = value;
    handleChange('options', newOptions);
  };

  const removeOption = (optionIndex: number) => {
    const options = localReflectionQuestion.options || { en: [''], si: [''] };
    handleChange('options', {
      en: options.en.filter((_, i) => i !== optionIndex),
      si: options.si.filter((_, i) => i !== optionIndex),
    });
  };

  const categoryColors: Record<string, string> = {
    general: 'bg-blue-100 text-blue-800 border-blue-300',
    challenging: 'bg-orange-100 text-orange-800 border-orange-300',
    success: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Reflection Question {index + 1}</CardTitle>
            <span className={`px-2 py-1 rounded text-xs font-semibold border ${categoryColors[localReflectionQuestion.category] || categoryColors.general}`}>
              {localReflectionQuestion.category}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={localReflectionQuestion.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="general">General (Default for all users)</option>
                <option value="challenging">Challenging (Score &lt; 60%)</option>
                <option value="success">Success (Score ≥ 80%)</option>
              </Select>
            </div>
            <div className="space-y-2 flex items-center">
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id={`isActive-${index}`}
                  checked={localReflectionQuestion.isActive !== false}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={`isActive-${index}`} className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prompt (English)</Label>
            <Textarea
              value={localReflectionQuestion.prompt.en}
              onChange={(e) =>
                handleChange('prompt', { ...localReflectionQuestion.prompt, en: e.target.value })
              }
              rows={2}
              placeholder="e.g., What did you learn from this lesson?"
            />
          </div>
          <div className="space-y-2">
            <Label>Prompt (Sinhala)</Label>
            <Textarea
              value={localReflectionQuestion.prompt.si}
              onChange={(e) =>
                handleChange('prompt', { ...localReflectionQuestion.prompt, si: e.target.value })
              }
              rows={2}
              placeholder="e.g., මෙම පාඩමෙන් ඔබ ඉගෙන ගත්තේ කුමක්ද?"
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Options (Include "Other" option to allow free text)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {localReflectionQuestion.options?.en.map((option, optIndex) => (
                <div key={optIndex} className="flex gap-2">
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption('en', optIndex, e.target.value)}
                    placeholder="English option"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={localReflectionQuestion.options?.si[optIndex] || ''}
                    onChange={(e) => updateOption('si', optIndex, e.target.value)}
                    placeholder="Sinhala option"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(optIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

