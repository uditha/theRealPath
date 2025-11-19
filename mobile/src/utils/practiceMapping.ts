/**
 * Maps practice IDs from AI responses to navigation routes and parameters
 */
export interface PracticeNavigationParams {
  screen: string;
  params?: any;
}

const PRACTICE_MAP: Record<string, PracticeNavigationParams> = {
  'anapanasati': {
    screen: 'PracticeDetail',
    params: { practiceId: 'anapanasati' },
  },
  'noting': {
    screen: 'NotingPractice',
  },
  'pause': {
    screen: 'PausePractice',
  },
  'sound': {
    screen: 'SoundAwareness',
  },
  'walking': {
    screen: 'WalkingMeditation',
  },
  'letting_go': {
    screen: 'LettingGo',
  },
  'thought_bubbles': {
    screen: 'ThoughtBubbles',
  },
  'body_scan': {
    screen: 'BodyScan',
  },
  'equanimity': {
    screen: 'Equanimity',
  },
  'karuna': {
    screen: 'Compassion',
  },
  'metta': {
    screen: 'MettaPractice',
  },
  'mudita': {
    screen: 'Mudita',
  },
};

/**
 * Gets navigation parameters for a practice ID
 * Returns null if the practice ID is not found
 */
export function getPracticeNavigationParams(practiceId: string | null): PracticeNavigationParams | null {
  if (!practiceId) {
    return null;
  }
  
  return PRACTICE_MAP[practiceId] || null;
}

/**
 * Checks if a practice ID is valid
 */
export function isValidPracticeId(practiceId: string | null): boolean {
  if (!practiceId) {
    return false;
  }
  
  return practiceId in PRACTICE_MAP;
}


