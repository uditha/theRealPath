import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import LessonFlowStackNavigator from './LessonFlowStackNavigator';
import WorldScreen from '../screens/World/WorldScreen';
import ChapterScreen from '../screens/Chapter/ChapterScreen';

const Stack = createNativeStackNavigator();

export default function AppStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tabs - Home, Cards, Profile */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      
      {/* Lesson flow - separate stack for lesson progression */}
      <Stack.Screen name="LessonFlow" component={LessonFlowStackNavigator} />
      
      {/* Path navigation */}
      <Stack.Screen 
        name="World" 
        component={WorldScreen}
        options={{ headerShown: true, title: 'World' }}
      />
      <Stack.Screen 
        name="Chapter" 
        component={ChapterScreen}
        options={{ headerShown: true, title: 'Chapter' }}
      />
    </Stack.Navigator>
  );
}










