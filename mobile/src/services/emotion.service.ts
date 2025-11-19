import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { EmotionType } from '../utils/emotions';

export interface EmotionTile {
  emotion: EmotionType;
  timestamp: number; // Unix timestamp in milliseconds
  hour: number; // 0-23
}

export interface DailyGrid {
  date: string; // ISO date string (YYYY-MM-DD)
  tiles: EmotionTile[];
}

export interface WeeklyGrid {
  weekStart: string; // ISO date string (YYYY-MM-DD)
  days: DailyGrid[];
}

export interface MonthlyGrid {
  monthStart: string; // ISO date string (YYYY-MM-DD)
  days: DailyGrid[];
}

export type ViewMode = 'daily' | 'weekly' | 'monthly';

class EmotionService {
  private async getAllDailyGrids(): Promise<DailyGrid[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_DAILY_GRIDS);
      if (!data) return [];
      const grids: DailyGrid[] = JSON.parse(data);
      
      // Migrate old emotion types to new ones
      return grids.map(grid => ({
        ...grid,
        tiles: grid.tiles.map(tile => ({
          ...tile,
          emotion: this.migrateEmotionType(tile.emotion as any),
        })),
      }));
    } catch (error) {
      console.error('Error loading daily grids:', error);
      return [];
    }
  }

  /**
   * Migrate old emotion types to new ones
   */
  private migrateEmotionType(oldType: string): EmotionType {
    const migrationMap: Record<string, EmotionType> = {
      'sadness': EmotionType.SADNESS_GRIEF,
      'anger': EmotionType.ANGER_AVERSION,
      'fear': EmotionType.FEAR_CONFUSION,
      'aversion': EmotionType.ANGER_AVERSION,
      'anxiety': EmotionType.FEAR_CONFUSION,
      'gratitude': EmotionType.JOY,
      'peace': EmotionType.CALM_CLARITY,
      'equanimity': EmotionType.CALM_CLARITY,
      // New types pass through
      'joy': EmotionType.JOY,
      'calm_clarity': EmotionType.CALM_CLARITY,
      'craving': EmotionType.CRAVING,
      'anger_aversion': EmotionType.ANGER_AVERSION,
      'fear_confusion': EmotionType.FEAR_CONFUSION,
      'sadness_grief': EmotionType.SADNESS_GRIEF,
    };
    
    return migrationMap[oldType] || EmotionType.JOY; // Default to JOY if unknown
  }

  private async saveAllDailyGrids(grids: DailyGrid[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMOTION_DAILY_GRIDS, JSON.stringify(grids));
    } catch (error) {
      console.error('Error saving daily grids:', error);
      throw error;
    }
  }

  /**
   * Save an emotion tile for the current hour
   */
  async saveEmotionTile(emotion: EmotionType): Promise<void> {
    const now = new Date();
    const dateStr = this.getDateString(now);
    const hour = now.getHours();
    const timestamp = now.getTime();

    const tile: EmotionTile = {
      emotion,
      timestamp,
      hour,
    };

    const allGrids = await this.getAllDailyGrids();
    const gridIndex = allGrids.findIndex(g => g.date === dateStr);

    if (gridIndex >= 0) {
      // Add tile to existing grid
      allGrids[gridIndex].tiles.push(tile);
    } else {
      // Create new daily grid
      allGrids.push({
        date: dateStr,
        tiles: [tile],
      });
    }

    await this.saveAllDailyGrids(allGrids);
  }

  /**
   * Get daily grid for a specific date
   */
  async getDailyGrid(date: Date): Promise<DailyGrid> {
    const dateStr = this.getDateString(date);
    const allGrids = await this.getAllDailyGrids();
    const grid = allGrids.find(g => g.date === dateStr);

    if (grid) {
      return grid;
    }

    // Return empty grid if not found
    return {
      date: dateStr,
      tiles: [],
    };
  }

  /**
   * Get weekly grid starting from a specific date
   */
  async getWeeklyGrid(weekStart: Date): Promise<WeeklyGrid> {
    const days: DailyGrid[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dailyGrid = await this.getDailyGrid(date);
      days.push(dailyGrid);
    }

    return {
      weekStart: this.getDateString(weekStart),
      days,
    };
  }

  /**
   * Get all daily grids (public method)
   */
  async getAllDailyGridsPublic(): Promise<DailyGrid[]> {
    return this.getAllDailyGrids();
  }

  /**
   * Clear all emotion data (for "let go" reset)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EMOTION_DAILY_GRIDS,
        STORAGE_KEYS.EMOTION_WEEKLY_REFLECTIONS,
        STORAGE_KEYS.EMOTION_LAST_VIEW_MODE,
      ]);
    } catch (error) {
      console.error('Error clearing emotion data:', error);
      throw error;
    }
  }

  /**
   * Clear today's emotion data
   */
  async clearTodayData(): Promise<void> {
    try {
      const today = new Date();
      const todayStr = this.getDateString(today);
      const allGrids = await this.getAllDailyGrids();
      const filteredGrids = allGrids.filter((grid) => grid.date !== todayStr);
      await this.saveAllDailyGrids(filteredGrids);
    } catch (error) {
      console.error('Error clearing today\'s data:', error);
      throw error;
    }
  }

  /**
   * Get last viewed mode (daily/weekly)
   */
  async getLastViewMode(): Promise<ViewMode> {
    try {
      const mode = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_LAST_VIEW_MODE);
      return (mode as ViewMode) || 'daily';
    } catch (error) {
      console.error('Error loading view mode:', error);
      return 'daily';
    }
  }

  /**
   * Save last viewed mode
   */
  async saveLastViewMode(mode: ViewMode): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMOTION_LAST_VIEW_MODE, mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  }

  /**
   * Check if onboarding is completed
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_ONBOARDING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMOTION_ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  }

  /**
   * Reset onboarding (for testing or user preference)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EMOTION_ONBOARDING_COMPLETED);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  /**
   * Helper: Get date string in YYYY-MM-DD format
   */
  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get week start date (Sunday) for a given date
   */
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get current week start
   */
  getCurrentWeekStart(): Date {
    return this.getWeekStart(new Date());
  }

  /**
   * Get month start date (first day of the month) for a given date
   */
  getMonthStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get monthly grid starting from a specific date (first day of the month)
   */
  async getMonthlyGrid(monthStart: Date): Promise<MonthlyGrid> {
    const days: DailyGrid[] = [];
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(year, month, i + 1);
      const dailyGrid = await this.getDailyGrid(date);
      days.push(dailyGrid);
    }

    return {
      monthStart: this.getDateString(monthStart),
      days,
    };
  }

}

export const emotionService = new EmotionService();

