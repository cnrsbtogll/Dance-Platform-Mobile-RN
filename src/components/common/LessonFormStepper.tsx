import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../utils/theme';

interface LessonFormStepperProps {
  currentStep: number; // 1-based
  totalSteps: number;
  stepTitles: string[];
  accentColor: string;
  textColor: string;
  subTextColor: string;
  backgroundColor: string;
}

export const LessonFormStepper: React.FC<LessonFormStepperProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
  accentColor,
  textColor,
  subTextColor,
  backgroundColor,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: accentColor,
              width: `${(currentStep / totalSteps) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Step circles + title */}
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <View key={stepNum} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && { backgroundColor: accentColor, borderColor: accentColor },
                  isCompleted && { backgroundColor: accentColor, borderColor: accentColor },
                  !isActive && !isCompleted && { borderColor: subTextColor },
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.stepCheckmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      { color: isActive ? '#fff' : subTextColor },
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Current step title */}
      <Text style={[styles.stepTitle, { color: textColor }]}>
        {stepTitles[currentStep - 1] || ''}
      </Text>
      <Text style={[styles.stepMeta, { color: subTextColor }]}>
        {currentStep} / {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepCheckmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600' as any,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  stepMeta: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
});
