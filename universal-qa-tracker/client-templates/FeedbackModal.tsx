/**
 * Universal Mobile Feedback & Bug Report Modal Template (client-templates/FeedbackModal.tsx).
 * Self-contained React Native / Expo modal component.
 * Allows users to submit structured feedback, feature suggestions, and bug reports
 * directly within the mobile application.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import {
  X,
  Star,
  Send,
  MessageSquareHeart,
  ShieldCheck,
  Mail,
} from 'lucide-react-native';
import {
  FeedbackService,
  FeedbackCategory,
  FeedbackSubmissionData,
} from './FeedbackService';
import { FeedbackSurveyCard } from './FeedbackSurveyCard';
import { SurveySelection } from './types/survey';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  language?: string;
  isPro?: boolean;
  primaryColor?: string;
  isDarkMode?: boolean;
  onSuccess?: () => void;
}

const CATEGORIES: { key: FeedbackCategory; label: string }[] = [
  { key: 'feature', label: '🚀 Feature' },
  { key: 'bug', label: '🐛 Bug Report' },
  { key: 'ux', label: '🎨 UX & Design' },
  { key: 'other', label: '💬 General' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  language = 'en',
  isPro = false,
  primaryColor = '#007AFF',
  isDarkMode = false,
  onSuccess,
}) => {
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>('');
  const [includeDevice, setIncludeDevice] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [surveySelection, setSurveySelection] = useState<SurveySelection | null>(null);

  useEffect(() => {
    if (visible) {
      setContent('');
      setCategory('feature');
      setRating(5);
      setIncludeDevice(true);
      setIsSubmitting(false);
      setSurveySelection(null);
    }
  }, [visible]);

  const colors = {
    surface: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    surfaceSubtle: isDarkMode ? '#2C2C2E' : '#F2F2F7',
    background: isDarkMode ? '#0A0A0C' : '#FFFFFF',
    textPrimary: isDarkMode ? '#FFFFFF' : '#1C1C1E',
    textSecondary: isDarkMode ? '#EBEBF5' : '#48484A',
    textMuted: '#8E8E93',
    border: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(60,60,67,0.12)',
    borderSubtle: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(60,60,67,0.06)',
    accent: primaryColor,
  };

  const handleSubmit = async () => {
    if (content.trim().length < 5) {
      Alert.alert('Notice', 'Please provide at least 5 characters for feedback.');
      return;
    }

    setIsSubmitting(true);

    const submission: FeedbackSubmissionData = {
      category,
      rating,
      content,
      includeDevice,
      language,
      isPro,
      surveyId: surveySelection?.surveyId,
      surveyQuestion: surveySelection?.question,
      surveyAnswer: surveySelection ? `[${surveySelection.selectedOptionId}번] ${surveySelection.selectedOptionText}` : undefined,
      surveyAnswerIndex: surveySelection?.selectedOptionId,
    };

    const result = await FeedbackService.sendFeedback(submission);
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert('Thank You!', 'Your feedback was successfully submitted.');
      if (onSuccess) onSuccess();
      onClose();
    } else if (result.rateLimited) {
      if (result.rateLimitReason === 'duplicate') {
        Alert.alert('Notice', 'Duplicate feedback has already been received. Thank you!');
      } else if (result.rateLimitReason === 'daily_limit') {
        Alert.alert('Notice', 'Daily feedback submission limit (5) reached. Please contact us via email.');
      } else {
        const remainingMinutes = Math.max(1, Math.ceil((result.remainingSeconds || 180) / 60));
        Alert.alert('Notice', `Feedback already received. Please wait ${remainingMinutes} minute(s) before submitting again.`);
      }
    } else {
      Alert.alert(
        'Submission Error',
        (result.error || 'Failed to submit feedback.') + '\n\nWould you like to send your feedback directly via email?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send via Email', onPress: handleMailtoFallback },
        ]
      );
    }
  };

  const handleMailtoFallback = async () => {
    await FeedbackService.openMailtoFallback({
      category,
      rating,
      content,
      includeDevice,
      language,
      isPro,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Header Bar */}
              <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle }]}>
                <View style={styles.headerTitleGroup}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.accent + '15' },
                    ]}
                  >
                    <MessageSquareHeart size={18} color={colors.accent} />
                  </View>
                  <View style={styles.headerTextCol}>
                    <Text
                      style={[styles.titleText, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      Send Feedback &amp; Ideas
                    </Text>
                    <Text
                      style={[styles.subtitleText, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      Help us improve with your suggestions
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollBody}
              >
                {/* 1. Category Chips */}
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Feedback Category
                  </Text>
                  <View style={styles.chipsRow}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <TouchableOpacity
                          key={cat.key}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? colors.accent
                                : colors.surfaceSubtle,
                              borderColor: isSelected
                                ? colors.accent
                                : colors.borderSubtle,
                            },
                          ]}
                          onPress={() => setCategory(cat.key)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected ? '#FFFFFF' : colors.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Rating Stars */}
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Overall Experience
                  </Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((score) => {
                      const isFilled = score <= rating;
                      return (
                        <TouchableOpacity
                          key={score}
                          style={styles.starTouchArea}
                          onPress={() => setRating(score)}
                          activeOpacity={0.7}
                        >
                          <Star
                            size={26}
                            color={isFilled ? '#F59E0B' : colors.border}
                            fill={isFilled ? '#F59E0B' : 'transparent'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Content TextInput */}
                <View style={styles.sectionBlock}>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="Tell us what you loved or what needs improvement..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={4}
                      maxLength={1000}
                      value={content}
                      onChangeText={setContent}
                      textAlignVertical="top"
                    />
                    <Text style={[styles.charCount, { color: colors.textMuted }]}>
                      {content.length}/1000
                    </Text>
                  </View>
                </View>

                {/* 3.5 Dynamic 4-Choice In-App Survey */}
                <View style={{ marginBottom: 12 }}>
                  <FeedbackSurveyCard
                    language={language}
                    onSelect={(sel) => setSurveySelection(sel)}
                  />
                </View>

                {/* 4. Include Device Info Switch */}
                <View
                  style={[
                    styles.deviceInfoBox,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={styles.deviceInfoLeft}>
                    <ShieldCheck size={16} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deviceInfoTitle, { color: colors.textPrimary }]}>
                        Include Device Diagnostic Info
                      </Text>
                      <Text style={[styles.deviceInfoSubtitle, { color: colors.textMuted }]}>
                        OS, version, and app release (never includes personal data)
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={includeDevice}
                    onValueChange={setIncludeDevice}
                    trackColor={{
                      false: isDarkMode ? '#333' : '#E0E0E0',
                      true: colors.accent + '80',
                    }}
                    thumbColor={includeDevice ? colors.accent : '#999'}
                  />
                </View>
              </ScrollView>

              {/* Action Footer */}
              <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor:
                        content.trim().length >= 5
                          ? colors.accent
                          : colors.surfaceSubtle,
                      opacity: isSubmitting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send
                        size={14}
                        color={
                          content.trim().length >= 5 ? '#FFFFFF' : colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.submitText,
                          {
                            color:
                              content.trim().length >= 5
                                ? '#FFFFFF'
                                : colors.textMuted,
                          },
                        ]}
                      >
                        Submit
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  titleText: {
    fontWeight: '700',
    fontSize: 16,
  },
  subtitleText: {
    marginTop: 1,
    fontSize: 11.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollBody: {
    padding: 16,
    gap: 12,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  starTouchArea: {
    padding: 2,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  textInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
    fontSize: 13,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 10.5,
  },
  deviceInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  deviceInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  deviceInfoTitle: {
    fontWeight: '600',
    fontSize: 12,
  },
  deviceInfoSubtitle: {
    marginTop: 1,
    fontSize: 10.5,
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  submitText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
