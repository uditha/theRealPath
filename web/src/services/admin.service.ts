import { api } from './api';

export interface World {
  id: string;
  nameEn: string;
  nameSi: string;
  orderIndex: number;
  themeKey: string;
  backgroundImageUrl?: string | null;
  isActive: boolean;
}

export interface Chapter {
  id: string;
  worldId: string;
  nameEn: string;
  nameSi: string;
  orderIndex: number;
}

export interface Slide {
  orderIndex: number;
  type: string;
  text: {
    en: string;
    si: string;
  };
  image?: string | null;
  videoUrlEn?: string | null;
  videoUrlSi?: string | null;
}

export interface Question {
  orderIndex: number;
  type: 'single_choice' | 'multi_select' | 'true_false';
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
  answer?: boolean;
}

export interface ReflectionQuestion {
  category: 'general' | 'challenging' | 'success';
  prompt: {
    en: string;
    si: string;
  };
  options: {
    en: string[];
    si: string[];
  };
  orderIndex?: number;
  isActive?: boolean;
}

export interface Lesson {
  id: string;
  chapterId: string;
  titleEn: string;
  titleSi: string;
  orderIndex: number;
  xpReward: number;
  isActive: boolean;
  slides: Slide[];
  questions: Question[];
  reflectionQuestions?: ReflectionQuestion[];
}

export interface Card {
  id: string;
  nameEn: string;
  nameSi: string;
  descriptionEn: string;
  descriptionSi: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
  imageUrl: string | null;
  unlockCondition: string | null | any; // Can be JSON object or string
}

export const adminService = {
  // Stats
  async getStats() {
    const response = await api.get('/v1/admin/stats');
    return response.data.data;
  },

  // Worlds
  async getWorlds() {
    const response = await api.get('/v1/admin/worlds');
    return response.data.data;
  },

  async createWorld(data: Omit<World, 'id'>) {
    const response = await api.post('/v1/admin/worlds', data);
    return response.data.data;
  },

  async updateWorld(id: string, data: Partial<World>) {
    const response = await api.put(`/v1/admin/worlds/${id}`, data);
    return response.data.data;
  },

  async deleteWorld(id: string) {
    const response = await api.delete(`/v1/admin/worlds/${id}`);
    return response.data;
  },

  // Chapters
  async getChapters(worldId?: string) {
    const url = worldId ? `/v1/worlds/${worldId}` : '/v1/worlds';
    const response = await api.get(url);
    if (worldId) {
      return response.data.data.chapters || [];
    }
    // Flatten chapters from all worlds
    const worlds = response.data.data;
    return worlds.flatMap((world: any) => world.chapters || []);
  },

  async createChapter(data: Omit<Chapter, 'id'>) {
    const response = await api.post('/v1/admin/chapters', data);
    return response.data.data;
  },

  async updateChapter(id: string, data: Partial<Chapter>) {
    const response = await api.put(`/v1/admin/chapters/${id}`, data);
    return response.data.data;
  },

  async deleteChapter(id: string) {
    const response = await api.delete(`/v1/admin/chapters/${id}`);
    return response.data;
  },

  // Lessons
  async getLesson(id: string) {
    const response = await api.get(`/v1/lessons/${id}`);
    return response.data.data;
  },

  async getLessonsByChapter(chapterId: string) {
    const response = await api.get(`/v1/lessons?chapterId=${chapterId}`);
    return response.data.data;
  },

  async createLesson(data: Omit<Lesson, 'id'>) {
    const response = await api.post('/v1/admin/lessons', data);
    return response.data.data;
  },

  async updateLesson(id: string, data: Partial<Lesson>) {
    const response = await api.put(`/v1/admin/lessons/${id}`, data);
    return response.data.data;
  },

  async deleteLesson(id: string) {
    const response = await api.delete(`/v1/admin/lessons/${id}`);
    return response.data;
  },

  // Cards
  async getCards() {
    const response = await api.get('/v1/cards');
    return response.data.data;
  },

  async createCard(data: Omit<Card, 'id'>) {
    const response = await api.post('/v1/admin/cards', data);
    return response.data.data;
  },

  async updateCard(id: string, data: Partial<Card>) {
    const response = await api.put(`/v1/admin/cards/${id}`, data);
    return response.data.data;
  },

  async deleteCard(id: string) {
    const response = await api.delete(`/v1/admin/cards/${id}`);
    return response.data;
  },

  // Users
  async getUsers() {
    const response = await api.get('/v1/admin/users');
    return response.data.data;
  },
};

