import React from 'react';
import { EmotionType } from '../../../utils/emotions';
import GardenFlower from './GardenFlower';
import GardenDroplet from './GardenDroplet';
import GardenThorn from './GardenThorn';
import GardenShadow from './GardenShadow';
import GardenVine from './GardenVine';
import GardenCrack from './GardenCrack';
import GardenLotus from './GardenLotus';

interface GardenElementWrapperProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  delay?: number;
  style?: any;
}

/**
 * Maps emotion types to their corresponding garden element components
 */
export const getGardenElement = (emotion: EmotionType) => {
  switch (emotion) {
    case EmotionType.JOY:
      return GardenFlower;
    case EmotionType.CALM_CLARITY:
      return GardenLotus;
    case EmotionType.SADNESS_GRIEF:
      return GardenDroplet;
    case EmotionType.ANGER_AVERSION:
      return GardenThorn;
    case EmotionType.FEAR_CONFUSION:
      return GardenShadow;
    case EmotionType.CRAVING:
      return GardenVine;
    default:
      return GardenFlower; // Default fallback
  }
};

/**
 * Renders the appropriate garden element for an emotion
 */
export const GardenElementWrapper: React.FC<GardenElementWrapperProps> = ({
  emotion,
  size = 24,
  animated = true,
  delay = 0,
  style,
}) => {
  const ElementComponent = getGardenElement(emotion);
  
  return (
    <ElementComponent
      emotion={emotion}
      size={size}
      animated={animated}
      delay={delay}
      style={style}
    />
  );
};

export { default as GardenFlower } from './GardenFlower';
export { default as GardenDroplet } from './GardenDroplet';
export { default as GardenThorn } from './GardenThorn';
export { default as GardenShadow } from './GardenShadow';
export { default as GardenVine } from './GardenVine';
export { default as GardenCrack } from './GardenCrack';
export { default as GardenLotus } from './GardenLotus';
export { default as GardenElement } from './GardenElement';

