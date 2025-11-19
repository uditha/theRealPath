import api from './api';

export const userService = {
  async getMe(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/v1/users/me');
    return response.data.data;
  },

  async updateMe(data: {
    languagePreference?: 'en' | 'si';
    dailyGoalXP?: number;
    name?: string;
    timezone?: string;
  }): Promise<any> {
    const response = await api.patch<{ success: boolean; data: any }>('/v1/users/me', data);
    return response.data.data;
  },

  async getUserStats(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/v1/users/me/stats');
    return response.data.data;
  },
};










