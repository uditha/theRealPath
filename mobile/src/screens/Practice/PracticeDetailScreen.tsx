import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import BreathingMindfulnessModal from '../Home/BreathingMindfulnessModal';

export default function PracticeDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { practiceId } = route.params || {};
  const [modalVisible, setModalVisible] = React.useState(false);

  useEffect(() => {
    // Open modal when screen loads
    setModalVisible(true);
  }, []);

  const handleClose = () => {
    setModalVisible(false);
    // Small delay to allow modal close animation
    setTimeout(() => {
      navigation.goBack();
    }, 300);
  };

  // For now, only Anapanasati is implemented
  if (practiceId === 'anapanasati') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <BreathingMindfulnessModal visible={modalVisible} onClose={handleClose} />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

