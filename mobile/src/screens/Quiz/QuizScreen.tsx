import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lesson, Question } from '../../services/content.service';
import { contentService } from '../../services/content.service';
import { logger } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: {
    fontSize: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  questionContainer: {
    backgroundColor: colors.card,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 28,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionButton: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#6B9BD1',
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 17,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: colors.button,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: colors.textTertiary,
    shadowOpacity: 0,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.buttonText,
    letterSpacing: 0.5,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 32,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.buttonText,
  },
  resultSubtext: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.button,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.buttonText,
  },
});

export default function QuizScreen({ route, navigation }: any) {
  const { lessonId, lesson, review = false, legendary = false } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language: contextLanguage, t } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: any }>({});
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState<'en' | 'si'>(contextLanguage);
  const { timeSpent: timeSpentBeforeQuiz = 0 } = route.params || {};
  const quizStartTime = React.useRef(Date.now());

  const questions = lesson?.quiz || [];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const question = questions[currentQuestion];
  
  const styles = createStyles(colors);
  
  // Sync language with context
  React.useEffect(() => {
    setLanguage(contextLanguage);
  }, [contextLanguage]);

  const handleAnswerSelect = (answer: any) => {
    if (question.type === 'single_choice') {
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: answer });
    } else if (question.type === 'multi_select') {
      const current = selectedAnswers[currentQuestion] || [];
      const newAnswer = current.includes(answer)
        ? current.filter((a: any) => a !== answer)
        : [...current, answer];
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: newAnswer });
    } else if (question.type === 'true_false') {
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: answer });
    }
  };

  const checkAnswer = (question: Question, userAnswer: any): boolean => {
    if (question.type === 'single_choice') {
      return userAnswer === question.correct_index;
    } else if (question.type === 'multi_select') {
      const correct = question.correct_indices || [];
      const user = Array.isArray(userAnswer) ? userAnswer : [];
      return (
        correct.length === user.length &&
        correct.every((idx) => user.includes(idx))
      );
    } else if (question.type === 'true_false') {
      return userAnswer === question.answer?.en;
    }
    return false;
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q: Question, index: number) => {
      if (checkAnswer(q, selectedAnswers[index])) {
        correct++;
      }
    });
    const percentage = Math.round((correct / questions.length) * 100);
    return { correct, total: questions.length, percentage };
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate score and time spent
      const result = calculateScore();
      const quizTimeSpent = Math.floor((Date.now() - quizStartTime.current) / 1000);
      const totalTimeSpent = timeSpentBeforeQuiz + quizTimeSpent;
      
      navigation.navigate('Reflection', {
        lessonId,
        lesson,
        score: result.percentage,
        correctCount: result.correct,
        totalQuestions: result.total,
        timeSpent: totalTimeSpent,
        review: review || false,
        legendary: legendary || false,
      });
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // handleSubmit removed - now handled in handleNext

  if (!question) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Text>No questions found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Removed showResult screen - now goes directly to Reflection

  const isSelected = (index: number) => {
    if (question.type === 'single_choice') {
      return selectedAnswers[currentQuestion] === index;
    } else if (question.type === 'multi_select') {
      return (selectedAnswers[currentQuestion] || []).includes(index);
    }
    return false;
  };

  const canProceed = () => {
    const answer = selectedAnswers[currentQuestion];
    if (question.type === 'multi_select') {
      return answer && answer.length > 0;
    }
    return answer !== undefined && answer !== null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1}/{questions.length}
        </Text>
        <TouchableOpacity
          onPress={() => setLanguage(language === 'en' ? 'si' : 'en')}
        >
          <Text style={styles.languageText}>
            {language === 'en' ? 'සිංහල' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {language === 'en' ? question.question.en : question.question.si}
          </Text>
        </View>

        {/* Options */}
        {question.options && (
          <View style={styles.optionsContainer}>
            {question.options[language].map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected(index) && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswerSelect(index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected(index) && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {isSelected(index) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* True/False */}
        {question.type === 'true_false' && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestion] === true && styles.optionButtonSelected,
              ]}
              onPress={() => handleAnswerSelect(true)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAnswers[currentQuestion] === true && styles.optionTextSelected,
                ]}
              >
                True
              </Text>
              {selectedAnswers[currentQuestion] === true && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestion] === false && styles.optionButtonSelected,
              ]}
              onPress={() => handleAnswerSelect(false)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAnswers[currentQuestion] === false && styles.optionTextSelected,
                ]}
              >
                False
              </Text>
              {selectedAnswers[currentQuestion] === false && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? (language === 'en' ? 'Finish Quiz →' : 'ප්‍රශ්න පත්‍රය අවසන් කරන්න →') : (language === 'en' ? 'Next →' : 'ඊළඟ →')}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}
