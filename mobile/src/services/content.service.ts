import api from './api';

export interface World {
  id: string;
  nameEn: string;
  nameSi: string;
  orderIndex: number;
  themeKey: string;
  backgroundImageUrl?: string | null;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  nameEn: string;
  nameSi: string;
  orderIndex: number;
  lessonCount: number;
}

export interface Lesson {
  lesson_id: string;
  chapter_id: string;
  type: string;
  title: {
    en: string;
    si: string;
  };
  world?: {
    id: string;
    nameEn: string;
    nameSi: string;
    themeKey: string;
    backgroundImageUrl?: string | null;
  };
  slides: Slide[];
  quiz: Question[];
  reflection: {
    prompt: {
      en: string;
      si: string;
    };
    options: {
      en: string[];
      si: string[];
    };
  };
  rewards: {
    xp: number;
    cards_unlocked: string[];
  };
  userProgress?: {
    status: string;
    bestScore: number;
    masteryLevel: number;
  };
}

export interface Slide {
  id: number;
  type: string;
  text: {
    en: string;
    si: string;
  };
  image: string | null;
  videoUrlEn?: string | null;
  videoUrlSi?: string | null;
}

export interface Question {
  id: number;
  type: string;
  question: {
    en: string;
    si: string;
  };
  options?: {
    en: string[];
    si: string[];
  };
  correct_index?: number;
  correct_indices?: number[];
  answer?: {
    en: boolean;
    si: boolean;
  };
}

export interface ProgressSummary {
  totalXP: number;
  level: number;
  levelProgress: {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpForNextLevel: number | null;
    progressPercentage: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  dailyGoal: {
    target: number;
    current: number;
    progress: number;
    reached: boolean;
  };
  hearts: {
    current: number;
    max: number;
  };
  completedLessons: number;
}

export const contentService = {
  async getWorlds(): Promise<World[]> {
    const response = await api.get<{ success: boolean; data: World[] }>('/v1/worlds');
    return response.data.data;
  },

  async getWorldById(id: string): Promise<World> {
    const response = await api.get<{ success: boolean; data: World }>(`/v1/worlds/${id}`);
    return response.data.data;
  },

  async getLessonById(id: string): Promise<Lesson> {
    const response = await api.get<{ success: boolean; data: Lesson }>(`/v1/lessons/${id}`);
    return response.data.data;
  },

  async getChapterById(id: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>(`/v1/chapters/${id}`);
    return response.data.data;
  },

  async getLessonsByChapter(chapterId: string): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>(`/v1/lessons?chapterId=${chapterId}`);
    return response.data.data;
  },

  async getProgressSummary(): Promise<ProgressSummary> {
    const response = await api.get<{ success: boolean; data: ProgressSummary }>('/v1/progress/summary');
    return response.data.data;
  },

  async startLesson(lessonId: string): Promise<any> {
    const response = await api.post(`/v1/progress/lesson/${lessonId}/start`);
    return response.data;
  },

  async completeLesson(lessonId: string, data: {
    score: number;
    correctCount: number;
    totalQuestions: number;
    heartsLost?: number;
    review?: boolean;
    legendary?: boolean;
  }): Promise<any> {
    const response = await api.post(`/v1/progress/lesson/${lessonId}/complete`, data);
    return response.data;
  },

  async getAllCards(): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/v1/cards');
    return response.data.data;
  },

  async getUserCards(): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/v1/cards/users/me/cards');
    return response.data.data;
  },

  async submitReflection(lessonId: string, data: {
    selectedOptions: string[];
    otherText?: string;
  }): Promise<any> {
    const response = await api.post(`/v1/lessons/${lessonId}/reflection`, data);
    return response.data;
  },

  async getUserProgress(): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/v1/progress');
    return response.data.data;
  },
};

