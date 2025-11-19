import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LessonSlidesScreen from '../screens/Lesson/LessonSlidesScreen';
import QuizScreen from '../screens/Quiz/QuizScreen';
import ReflectionScreen from '../screens/Lesson/ReflectionScreen';
import LessonCompleteScreen from '../screens/Lesson/LessonCompleteScreen';

const Stack = createNativeStackNavigator();

export default function LessonFlowStackNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade', // Smooth fade transition
        animationDuration: 300,
      }}
    >
      <Stack.Screen 
        name="LessonSlides" 
        component={LessonSlidesScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="Quiz" 
        component={QuizScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Reflection" 
        component={ReflectionScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="LessonComplete" 
        component={LessonCompleteScreen}
        options={{
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
}

