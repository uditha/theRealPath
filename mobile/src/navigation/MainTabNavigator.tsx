import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Home Stack
import HomeScreen from '../screens/Home/HomeScreen';
import PathScreen from '../screens/Path/PathScreen';
import KalyanamittaQuestionScreen from '../screens/Kalyanamitta/KalyanamittaQuestionScreen';
import KalyanamittaReplyScreen from '../screens/Kalyanamitta/KalyanamittaReplyScreen';

// Profile Stack
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

// Awareness Stack
import AwarenessScreen from '../screens/Awareness/AwarenessScreen';
import WeeklyReflectionScreen from '../screens/Awareness/WeeklyReflectionScreen';

// Practice Stack
import PracticeScreen from '../screens/Practice/PracticeScreen';
import PracticeDetailScreen from '../screens/Practice/PracticeDetailScreen';
import NotingPracticeScreen from '../screens/Practice/NotingPracticeScreen';
import MettaPracticeScreen from '../screens/Practice/MettaPracticeScreen';
import PausePracticeScreen from '../screens/Practice/PausePracticeScreen';
import SoundAwarenessScreen from '../screens/Practice/SoundAwarenessScreen';
import WalkingMeditationScreen from '../screens/Practice/WalkingMeditationScreen';
import LettingGoScreen from '../screens/Practice/LettingGoScreen';
import MindfulThoughtBubblesScreen from '../screens/Practice/MindfulThoughtBubblesScreen';
import BodyScanScreen from '../screens/Practice/BodyScanScreen';
import EquanimityScreen from '../screens/Practice/EquanimityScreen';
import CompassionScreen from '../screens/Practice/CompassionScreen';
import MuditaScreen from '../screens/Practice/MuditaScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const PathStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AwarenessStack = createNativeStackNavigator();
const PracticeStack = createNativeStackNavigator();

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen 
        name="KalyanamittaQuestion" 
        component={KalyanamittaQuestionScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="KalyanamittaReply" 
        component={KalyanamittaReplyScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

// Path Stack Navigator
function PathStackNavigator() {
  return (
    <PathStack.Navigator screenOptions={{ headerShown: false }}>
      <PathStack.Screen name="Path" component={PathScreen} />
    </PathStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

// Awareness Stack Navigator
function AwarenessStackNavigator() {
  return (
    <AwarenessStack.Navigator screenOptions={{ headerShown: false }}>
      <AwarenessStack.Screen name="Awareness" component={AwarenessScreen} />
      <AwarenessStack.Screen 
        name="WeeklyReflection" 
        component={WeeklyReflectionScreen}
        options={{ headerShown: false }}
      />
    </AwarenessStack.Navigator>
  );
}

// Practice Stack Navigator
function PracticeStackNavigator() {
  return (
    <PracticeStack.Navigator screenOptions={{ headerShown: false }}>
      <PracticeStack.Screen name="Practice" component={PracticeScreen} />
      <PracticeStack.Screen 
        name="PracticeDetail" 
        component={PracticeDetailScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="NotingPractice" 
        component={NotingPracticeScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="MettaPractice" 
        component={MettaPracticeScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="PausePractice" 
        component={PausePracticeScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="SoundAwareness" 
        component={SoundAwarenessScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="WalkingMeditation" 
        component={WalkingMeditationScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="LettingGo" 
        component={LettingGoScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="ThoughtBubbles" 
        component={MindfulThoughtBubblesScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="BodyScan" 
        component={BodyScanScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="Equanimity" 
        component={EquanimityScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="Compassion" 
        component={CompassionScreen}
        options={{ headerShown: false }}
      />
      <PracticeStack.Screen 
        name="Mudita" 
        component={MuditaScreen}
        options={{ headerShown: false }}
      />
    </PracticeStack.Navigator>
  );
}

export default function MainTabNavigator() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent, // Fixed: Use Buddhist gold accent color from theme
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Fixed: Improved safe area handling for iOS (notch, Dynamic Island, home indicator)
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          // Fixed: Better height calculation - base height (60) + safe area bottom inset
          height: 60 + insets.bottom,
          minHeight: 60, // Ensure minimum height on devices without safe areas
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: language === 'en' ? 'Home' : 'මුල් පිටුව',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size + 2}
              color={focused ? colors.accent : color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="PathTab"
        component={PathStackNavigator}
        options={{
          tabBarLabel: language === 'en' ? 'Path' : 'මාර්ගය',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              size={size + 2}
              color={focused ? colors.accent : color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AwarenessTab"
        component={AwarenessStackNavigator}
        options={{
          tabBarLabel: language === 'en' ? 'Awareness' : 'සැලකිල්ල',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'leaf' : 'leaf-outline'}
              size={size + 2}
              color={focused ? colors.accent : color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="PracticeTab"
        component={PracticeStackNavigator}
        options={{
          tabBarLabel: language === 'en' ? 'Practice' : 'පුරුදුව',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'fitness' : 'fitness-outline'}
              size={size + 2}
              color={focused ? colors.accent : color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: language === 'en' ? 'Profile' : 'පැතිකඩ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size + 2}
              color={focused ? colors.accent : color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

