/**
 * World Themes System
 * Defines visual themes for each world including backgrounds, colors, and animations
 */

export interface WorldTheme {
  id: string;
  name: string;
  backgroundGradient: string[]; // Array of colors for gradient
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pathColor: string;
  nodeGlowColor: string;
  backgroundImage?: string; // Optional background image URL
  particles?: {
    type: 'leaves' | 'petals' | 'clouds' | 'none';
    color: string;
  };
  soundTheme?: string; // Optional sound identifier
}

export const WORLD_THEMES: Record<string, WorldTheme> = {
  foundations: {
    id: 'foundations',
    name: 'Foundations',
    backgroundGradient: ['#E8F5E9', '#C8E6C9', '#A5D6A7'], // Peaceful village / early morning
    primaryColor: '#4CAF50',
    secondaryColor: '#81C784',
    accentColor: '#66BB6A',
    pathColor: '#66BB6A',
    nodeGlowColor: '#4CAF50',
    backgroundImage: undefined, // Set this to your image URL, e.g., 'https://example.com/foundations-bg.jpg'
    particles: {
      type: 'leaves',
      color: '#4CAF50',
    },
  },
  four_noble_truths: {
    id: 'four_noble_truths',
    name: 'Four Noble Truths',
    backgroundGradient: ['#FFF3E0', '#FFE0B2', '#FFCC80'], // Forest sunrise
    primaryColor: '#FF9800',
    secondaryColor: '#FFB74D',
    accentColor: '#FFA726',
    pathColor: '#FF9800',
    nodeGlowColor: '#FF6F00',
    particles: {
      type: 'leaves',
      color: '#FF9800',
    },
  },
  eightfold_path: {
    id: 'eightfold_path',
    name: 'Eightfold Path',
    backgroundGradient: ['#E3F2FD', '#BBDEFB', '#90CAF9'], // Mountain path with lanterns
    primaryColor: '#2196F3',
    secondaryColor: '#64B5F6',
    accentColor: '#42A5F5',
    pathColor: '#2196F3',
    nodeGlowColor: '#1976D2',
    particles: {
      type: 'clouds',
      color: '#FFFFFF',
    },
  },
  dhammapada: {
    id: 'dhammapada',
    name: 'Dhammapada',
    backgroundGradient: ['#FFFDE7', '#FFF9C4', '#FFF59D'], // Golden temple courtyard
    primaryColor: '#FFC107',
    secondaryColor: '#FFD54F',
    accentColor: '#FFCA28',
    pathColor: '#FFC107',
    nodeGlowColor: '#FFA000',
    particles: {
      type: 'petals',
      color: '#FFC107',
    },
  },
  sutta_stories: {
    id: 'sutta_stories',
    name: 'Sutta Stories',
    backgroundGradient: ['#E0F2F1', '#B2DFDB', '#80CBC4'], // Riverbank & Bodhi leaves
    primaryColor: '#009688',
    secondaryColor: '#4DB6AC',
    accentColor: '#26A69A',
    pathColor: '#009688',
    nodeGlowColor: '#00695C',
    particles: {
      type: 'leaves',
      color: '#009688',
    },
  },
  mindfulness: {
    id: 'mindfulness',
    name: 'Mindfulness',
    backgroundGradient: ['#E1BEE7', '#CE93D8', '#BA68C8'], // Calm lake & floating lotuses
    primaryColor: '#9C27B0',
    secondaryColor: '#AB47BC',
    accentColor: '#8E24AA',
    pathColor: '#9C27B0',
    nodeGlowColor: '#7B1FA2',
    particles: {
      type: 'petals',
      color: '#9C27B0',
    },
  },
  default: {
    id: 'default',
    name: 'Default',
    backgroundGradient: ['#F5F5F5', '#E0E0E0', '#BDBDBD'],
    primaryColor: '#6B9BD1',
    secondaryColor: '#90CAF9',
    accentColor: '#64B5F6',
    pathColor: '#6B9BD1',
    nodeGlowColor: '#4A7BA7',
    particles: {
      type: 'none',
      color: '#6B9BD1',
    },
  },
};

/**
 * Get theme for a world by themeKey
 */
export function getWorldTheme(themeKey: string | null | undefined): WorldTheme {
  if (!themeKey) {
    return WORLD_THEMES.default;
  }
  
  const key = themeKey.toLowerCase().replace(/\s+/g, '_');
  return WORLD_THEMES[key] || WORLD_THEMES.default;
}

/**
 * Get theme colors as React Native color strings
 */
export function getThemeColors(theme: WorldTheme) {
  return {
    background: theme.backgroundGradient[0],
    backgroundGradient: theme.backgroundGradient,
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor,
    path: theme.pathColor,
    glow: theme.nodeGlowColor,
  };
}

