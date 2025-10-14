/**
 * Guide Modal Component
 *
 * Interactive step-by-step guide to help users learn the app.
 * Shows key features and how to use them.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, ChevronLeft, ChevronRight, Dumbbell, Target, Calendar, TrendingUp, Award } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type GuideStep = {
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  tips: string[];
};

const guideSteps: GuideStep[] = [
  {
    title: 'Welcome to Arm Wrestling Training',
    description: 'This app helps you track your training, monitor progress, and achieve your arm wrestling goals. Let\'s walk through the key features.',
    icon: Dumbbell,
    iconColor: '#E63946',
    tips: [
      'Track workouts and exercises',
      'Monitor your strength progress',
      'Set and achieve goals',
      'Plan training cycles',
    ],
  },
  {
    title: 'Log Your Workouts',
    description: 'Navigate to the Training tab to log your workouts. Record workout type, duration, intensity, and specific exercises with sets, reps, and weights.',
    icon: Dumbbell,
    iconColor: '#2A7DE1',
    tips: [
      'Choose workout type (Strength, Technique, etc.)',
      'Add exercises with detailed tracking',
      'Associate workouts with training cycles',
      'View your workout history',
    ],
  },
  {
    title: 'Create Training Cycles',
    description: 'Organize your training into cycles for better periodization. Each cycle has a specific focus and timeline to help you peak at the right time.',
    icon: Calendar,
    iconColor: '#4CAF50',
    tips: [
      'Set start and end dates',
      'Choose cycle type (Strength, Recovery, etc.)',
      'Track workouts within cycles',
      'Only one cycle can be active at a time',
    ],
  },
  {
    title: 'Track Your Progress',
    description: 'Use the Progress tab to monitor your improvements. Log strength tests, set goals, and view detailed analytics of your training.',
    icon: TrendingUp,
    iconColor: '#FFD700',
    tips: [
      'Record strength test results regularly',
      'View progress graphs over time',
      'Set specific goals with deadlines',
      'Monitor goal completion',
    ],
  },
  {
    title: 'Set Training Goals',
    description: 'Define clear, measurable goals to stay motivated. Track your progress toward each goal and celebrate when you achieve them.',
    icon: Target,
    iconColor: '#E63946',
    tips: [
      'Set target values and deadlines',
      'Track current progress',
      'Mark goals as complete',
      'Create multiple goals simultaneously',
    ],
  },
  {
    title: 'Schedule Training Sessions',
    description: 'Plan ahead by scheduling your training sessions in the Calendar tab. Set reminders so you never miss a workout.',
    icon: Calendar,
    iconColor: '#2A7DE1',
    tips: [
      'Schedule training in advance',
      'Set notification reminders',
      'Mark sessions as complete',
      'View your training calendar',
    ],
  },
  {
    title: 'Customize Your Experience',
    description: 'Visit your Profile to personalize the app. Change your weight unit preference, toggle light/dark theme, and track your measurements.',
    icon: Award,
    iconColor: '#4CAF50',
    tips: [
      'Switch between lbs and kg',
      'Toggle light/dark theme',
      'Track body measurements',
      'View your training statistics',
    ],
  },
];

type GuideModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function GuideModal({ visible, onClose }: GuideModalProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - close guide
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = guideSteps[currentStep];
  const IconComponent = step.icon;
  const isLastStep = currentStep === guideSteps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              App Guide
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {guideSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index === currentStep
                        ? colors.primary
                        : index < currentStep
                        ? colors.success
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${step.iconColor}20` }]}>
              <IconComponent size={64} color={step.iconColor} />
            </View>

            {/* Step Number */}
            <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>
              Step {currentStep + 1} of {guideSteps.length}
            </Text>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {step.title}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {step.description}
            </Text>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Key Features:
              </Text>
              {step.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: step.iconColor }]} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              disabled={currentStep === 0}
              style={[
                styles.navButton,
                styles.previousButton,
                { borderColor: colors.border },
                currentStep === 0 && styles.navButtonDisabled,
              ]}
            >
              <ChevronLeft
                size={20}
                color={currentStep === 0 ? colors.border : colors.primary}
              />
              <Text
                style={[
                  styles.navButtonText,
                  { color: currentStep === 0 ? colors.border : colors.primary },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              {!isLastStep && <ChevronRight size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  stepNumber: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    borderWidth: 2,
  },
  nextButton: {
    flex: 1.5,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
