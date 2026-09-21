/**
 * Survey Data Model Types for User Feedback & VOC.
 * 100% English codebase (< 100 lines).
 */

export interface SurveyOption {
  id: number; // 1, 2, 3, 4
  text: string; // Localized text displayed to user
  textKo: string; // Normalized Korean text for uniform Google Sheets aggregation
  textEn: string; // English fallback text
}

export interface SurveyConfig {
  id: string; // e.g. "SURVEY_2026_Q3_ROADMAP"
  question: string; // Localized question displayed to user
  questionKo: string; // Normalized Korean question
  questionEn: string; // English fallback question
  options: SurveyOption[];
  active: boolean;
  updatedAt?: string;
}

export interface SurveySelection {
  surveyId: string;
  questionKo: string;
  answerIndex: number;
  answerKo: string;
  answerText?: string;
}
