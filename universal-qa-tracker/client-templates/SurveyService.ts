/**
 * Survey Service (services/surveyService.ts).
 * Manages active survey retrieval from Google Sheets Apps Script,
 * local caching via AsyncStorage, and deterministic English fallback resolution.
 * 100% English codebase with strict error handling (< 180 lines).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurveyConfig, SurveyOption, SurveySelection } from './types/survey';
import { buildDefaultSurveyConfig } from './defaultSurvey';
import { FEEDBACK_ENDPOINT } from './FeedbackService';

const SURVEY_CACHE_KEY = '@universal_active_survey_cache';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 6; // 6 hours cache validity

interface CachedSurveyPayload {
  timestamp: number;
  data: SurveyConfig;
}

export class SurveyService {
  /**
   * Returns the immediate fallback survey configuration synchronously.
   * Default language falls back to English ('en') if unspecified or unmapped.
   */
  public static getDefaultSurvey(language: string = 'en'): SurveyConfig {
    return buildDefaultSurveyConfig(language);
  }

  /**
   * Retrieves the cached survey from AsyncStorage if available.
   */
  public static async getCachedSurvey(): Promise<SurveyConfig | null> {
    try {
      const raw = await AsyncStorage.getItem(SURVEY_CACHE_KEY);
      if (!raw) return null;
      const parsed: CachedSurveyPayload = JSON.parse(raw);
      if (parsed && parsed.data && parsed.data.options && parsed.data.options.length === 4) {
        return parsed.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Persists the fetched survey into AsyncStorage.
   */
  public static async setCachedSurvey(survey: SurveyConfig): Promise<void> {
    try {
      const payload: CachedSurveyPayload = {
        timestamp: Date.now(),
        data: survey,
      };
      await AsyncStorage.setItem(SURVEY_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Non-fatal cache write failure
    }
  }

  /**
   * Resolves remote raw survey payload into a safe SurveyConfig.
   * Enforces universal English ('en') fallback if translation is empty or malformed.
   */
  public static resolveSurveyData(raw: any, language: string = 'en'): SurveyConfig {
    const fallback = buildDefaultSurveyConfig(language);
    if (!raw || typeof raw !== 'object') {
      return fallback;
    }

    const id = String(raw.id || fallback.id);
    const questionEn = String(raw.questionEn || raw.question_en || fallback.questionEn);
    const questionKo = String(raw.questionKo || raw.question_ko || fallback.questionKo);

    // Primary rule: Use requested language question -> English question -> Korean question
    let question = String(raw.question || '').trim();
    if (!question) {
      question = language.toLowerCase().startsWith('ko') ? questionKo : questionEn;
    }

    const rawOptions = Array.isArray(raw.options) ? raw.options : [];
    const options: SurveyOption[] = [];

    for (let i = 0; i < 4; i++) {
      const optRaw = rawOptions[i] || {};
      const fallbackOpt = fallback.options[i];
      const optId = Number(optRaw.id || i + 1);
      const textEn = String(optRaw.textEn || optRaw.text_en || fallbackOpt.textEn);
      const textKo = String(optRaw.textKo || optRaw.text_ko || fallbackOpt.textKo);

      let text = String(optRaw.text || '').trim();
      if (!text) {
        text = language.toLowerCase().startsWith('ko') ? textKo : textEn;
      }

      options.push({
        id: optId,
        text,
        textKo,
        textEn,
      });
    }

    return {
      id,
      question,
      questionKo,
      questionEn,
      options,
      active: raw.active !== false,
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Fetches active survey from Google Sheets Apps Script Web App.
   * Falls back to cached survey, and finally to default seed survey.
   */
  public static async fetchActiveSurvey(language: string = 'en'): Promise<SurveyConfig> {
    const defaultSurvey = buildDefaultSurveyConfig(language);

    if (!FEEDBACK_ENDPOINT || FEEDBACK_ENDPOINT.includes('DummyEndpoint')) {
      return defaultSurvey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `${FEEDBACK_ENDPOINT}?action=getSurvey&lang=${encodeURIComponent(language)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.status === 'success' && json.survey) {
          const resolved = this.resolveSurveyData(json.survey, language);
          await this.setCachedSurvey(resolved);
          return resolved;
        }
      }
    } catch {
      // Network failure or timeout -> proceed to cache fallback
    }

    // Attempt cache fallback
    const cached = await this.getCachedSurvey();
    if (cached) {
      return this.resolveSurveyData(cached, language);
    }

    return defaultSurvey;
  }

  /**
   * Normalizes a selected survey option into a uniform SurveySelection object.
   * Standardizes answers with Korean base text and 1-based index (e.g. "[1번] 위젯 스타일/폰트 추가")
   * for streamlined Google Spreadsheet pivot and chart aggregation.
   */
  public static normalizeResponse(
    survey: SurveyConfig,
    selectedOptionId: number
  ): SurveySelection | null {
    const option = survey.options.find((o) => o.id === selectedOptionId);
    if (!option) return null;

    return {
      surveyId: survey.id,
      questionKo: survey.questionKo,
      answerIndex: option.id,
      answerKo: `[${option.id}번] ${option.textKo}`,
      answerText: option.text,
    };
  }
}
