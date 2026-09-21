/**
 * Feedback Survey Card (components/settings/feedback/FeedbackSurveyCard.tsx).
 * Renders a 2x2 grid of 4 multiple-choice options for active user feedback survey.
 * 100% English codebase with clean Figma-style typography (< 140 lines).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BarChart2 } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { useTypography } from '../../../hooks/useTypography';
import { SurveyConfig } from './types/survey';
import { t } from '../../../i18n';
import { Spacing, Radius } from '../../../constants/Layout';

export interface FeedbackSurveyCardProps {
  survey: SurveyConfig;
  selectedOptionId: number | null;
  onSelectOption: (id: number) => void;
}

export const FeedbackSurveyCard: React.FC<FeedbackSurveyCardProps> = ({
  survey,
  selectedOptionId,
  onSelectOption,
}) => {
  const { theme, isDark } = useTheme();
  const { scaleFont } = useTypography();

  if (!survey || !Array.isArray(survey.options) || survey.options.length < 4) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : theme.surfaceSubtle,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border,
        },
      ]}
    >
      {/* Header Row: Icon + Question + Optional Badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : theme.accentPrimary + '15' },
            ]}
          >
            <BarChart2 size={13} color={theme.accentPrimary} />
          </View>
          <Text
            style={[
              styles.questionText,
              { color: theme.textPrimary, fontSize: scaleFont(12) },
            ]}
            numberOfLines={2}
          >
            {survey.question}
          </Text>
        </View>

        <View
          style={[
            styles.optionalBadge,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.optionalBadgeText,
              { color: theme.textMuted, fontSize: scaleFont(9.5) },
            ]}
          >
            {t('settings.feedbackSurveyOptionalBadge')}
          </Text>
        </View>
      </View>

      {/* 2x2 Grid Options */}
      <View style={styles.grid}>
        {survey.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.22)'
                      : theme.accentPrimary + '15'
                    : isDark
                    ? '#1E293B'
                    : theme.surface,
                  borderColor: isSelected ? theme.accentPrimary : theme.border,
                },
              ]}
              onPress={() => onSelectOption(opt.id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.numberBadge,
                  {
                    backgroundColor: isSelected
                      ? theme.accentPrimary
                      : isDark
                      ? '#334155'
                      : theme.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontSize: scaleFont(9.5),
                    },
                  ]}
                >
                  {opt.id}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? theme.accentPrimary : theme.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: scaleFont(11),
                    lineHeight: scaleFont(14),
                  },
                ]}
                numberOfLines={2}
              >
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  questionText: {
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
  optionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 0.8,
  },
  optionalBadgeText: {
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  optionCard: {
    width: '48.5%',
    minHeight: 44,
    borderRadius: Radius.sm + 2,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  numberText: {
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
  },
});
