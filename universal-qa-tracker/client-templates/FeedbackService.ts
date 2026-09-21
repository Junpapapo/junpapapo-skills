/**
 * Universal User Feedback & VOC Client Service (client-templates/FeedbackService.ts).
 * Handles sending structured feedback to Google Apps Script Web App endpoint,
 * collecting safe device diagnostics, client-side rate limiting/anti-spam, and providing mailto fallback.
 * Cross-platform (React Native / Expo / Web).
 */

import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FeedbackCategory = 'feature' | 'bug' | 'ux' | 'other';
export type FeedbackSource = 'in_app' | 'play_store' | 'app_store';

export const FEEDBACK_RATE_LIMIT_KEY = '@app_feedback_rate_limit_meta';
export const FEEDBACK_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown
export const FEEDBACK_MAX_DAILY_SUBMISSIONS = 5; // Max 5 submissions per day

export interface FeedbackRateLimitMeta {
  lastSentAt: number;
  lastContentHash: string;
  dailyDate: string;
  dailyCount: number;
}

export interface FeedbackRateLimitStatus {
  allowed: boolean;
  reason?: 'cooldown' | 'duplicate' | 'daily_limit';
  remainingSeconds?: number;
}

export interface DeviceDiagnostics {
  os: string;
  osVersion: string | number;
  appVersion: string;
  language: string;
  isPro?: boolean;
}

export interface FeedbackSubmissionData {
  category: FeedbackCategory;
  rating: number;
  content: string;
  includeDevice: boolean;
  language: string;
  isPro?: boolean;
  surveyId?: string;
  surveyQuestion?: string;
  surveyAnswer?: string;
  surveyAnswerIndex?: number;
}

export interface FeedbackPayload {
  id: string;
  timestamp: string;
  category: FeedbackCategory;
  rating: number;
  content: string;
  source?: FeedbackSource;
  device?: DeviceDiagnostics;
  surveyId?: string;
  surveyQuestion?: string;
  surveyAnswer?: string;
  surveyAnswerIndex?: number;
}

export interface FeedbackSendResult {
  success: boolean;
  error?: string;
  fallbackToMail?: boolean;
  rateLimited?: boolean;
  rateLimitReason?: 'cooldown' | 'duplicate' | 'daily_limit';
  remainingSeconds?: number;
}

// Configured via EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL in .env
export const FEEDBACK_ENDPOINT =
  process.env.EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL ||
  'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

export const SUPPORT_EMAIL = 'support@example.com';

export class FeedbackService {
  /**
   * Generates safe device & app metadata for troubleshooting.
   */
  public static getDeviceDiagnostics(
    language: string,
    isPro?: boolean,
    includeDetails: boolean = true
  ): DeviceDiagnostics {
    return {
      os: Platform.OS,
      osVersion: includeDetails ? Platform.Version : '',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      language,
      isPro: !!isPro,
    };
  }

  /**
   * Generates a stable deterministic hash of feedback content to prevent identical duplicate spam.
   */
  public static hashContent(category: string, content: string, surveyAnswer?: string): string {
    const normalized = `${category}:${content.trim().toLowerCase()}:${(surveyAnswer || '').trim().toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash << 5) - hash + normalized.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }

  /**
   * Constructs the structured feedback payload.
   */
  public static createPayload(data: FeedbackSubmissionData): FeedbackPayload {
    const id = `FB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const payload: FeedbackPayload = {
      id,
      timestamp,
      category: data.category,
      rating: Math.max(1, Math.min(5, data.rating)),
      content: data.content.trim(),
      source: 'in_app',
      device: this.getDeviceDiagnostics(data.language, data.isPro, data.includeDevice),
      ...(data.surveyId ? { surveyId: data.surveyId } : {}),
      ...(data.surveyQuestion ? { surveyQuestion: data.surveyQuestion } : {}),
      ...(data.surveyAnswer ? { surveyAnswer: data.surveyAnswer } : {}),
      ...(data.surveyAnswerIndex !== undefined ? { surveyAnswerIndex: data.surveyAnswerIndex } : {}),
    };

    return payload;
  }

  /**
   * Evaluates local rate limiting metadata against cooldown, daily quota, and duplicate content.
   * Fail-open: returns allowed: true if AsyncStorage encounters an error.
   */
  public static async checkRateLimit(data: FeedbackSubmissionData): Promise<FeedbackRateLimitStatus> {
    try {
      const raw = await AsyncStorage.getItem(FEEDBACK_RATE_LIMIT_KEY);
      if (!raw) {
        return { allowed: true };
      }

      const meta: FeedbackRateLimitMeta = JSON.parse(raw);
      const now = Date.now();
      const today = new Date().toISOString().split('T')[0];

      // 1. Daily limit check (Max submissions per day)
      if (meta.dailyDate === today && meta.dailyCount >= FEEDBACK_MAX_DAILY_SUBMISSIONS) {
        return { allowed: false, reason: 'daily_limit' };
      }

      // 2. Cooldown check (3 minutes between submissions)
      if (meta.lastSentAt) {
        const elapsed = now - meta.lastSentAt;
        if (elapsed < FEEDBACK_COOLDOWN_MS) {
          const remainingSeconds = Math.max(1, Math.ceil((FEEDBACK_COOLDOWN_MS - elapsed) / 1000));
          return {
            allowed: false,
            reason: 'cooldown',
            remainingSeconds,
          };
        }
      }

      // 3. Exact duplicate content check
      const currentHash = this.hashContent(data.category, data.content, data.surveyAnswer);
      if (meta.lastContentHash && meta.lastContentHash === currentHash) {
        return { allowed: false, reason: 'duplicate' };
      }

      return { allowed: true };
    } catch {
      // Fail-open to avoid blocking legitimate user submissions on storage errors
      return { allowed: true };
    }
  }

  /**
   * Persists updated rate limiting metadata upon successful submission.
   */
  public static async recordSubmissionSuccess(data: FeedbackSubmissionData): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(FEEDBACK_RATE_LIMIT_KEY);
      const meta: Partial<FeedbackRateLimitMeta> = raw ? JSON.parse(raw) : {};
      const today = new Date().toISOString().split('T')[0];
      const dailyCount = meta.dailyDate === today ? (meta.dailyCount || 0) + 1 : 1;
      const currentHash = this.hashContent(data.category, data.content, data.surveyAnswer);

      const updatedMeta: FeedbackRateLimitMeta = {
        lastSentAt: Date.now(),
        lastContentHash: currentHash,
        dailyDate: today,
        dailyCount,
      };

      await AsyncStorage.setItem(FEEDBACK_RATE_LIMIT_KEY, JSON.stringify(updatedMeta));
    } catch {
      // Non-blocking storage failure
    }
  }

  /**
   * Clears rate limit metadata (used primarily in test suites or diagnostic resets).
   */
  public static async resetRateLimit(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FEEDBACK_RATE_LIMIT_KEY);
    } catch {
      // Non-blocking failure
    }
  }

  /**
   * Sends the feedback payload to the serverless Google Apps Script webhook with rate limit checks.
   */
  public static async sendFeedback(
    data: FeedbackSubmissionData,
    bypassRateLimit: boolean = false
  ): Promise<FeedbackSendResult> {
    if (!data.content || data.content.trim().length < 5) {
      return { success: false, error: 'Min content length is 5 characters' };
    }

    if (!bypassRateLimit) {
      const rateLimit = await this.checkRateLimit(data);
      if (!rateLimit.allowed) {
        return {
          success: false,
          rateLimited: true,
          rateLimitReason: rateLimit.reason,
          remainingSeconds: rateLimit.remainingSeconds,
          error: `Feedback rate limited: ${rateLimit.reason}`,
        };
      }
    }

    const payload = this.createPayload(data);

    if (FEEDBACK_ENDPOINT.includes('YOUR_APPS_SCRIPT_WEB_APP_URL_HERE')) {
      console.warn('[FeedbackService] Warning: Webhook URL is unconfigured placeholder. Simulating success.');
      await this.recordSubmissionSuccess(data);
      return { success: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await this.recordSubmissionSuccess(data);
        return { success: true };
      }

      return {
        success: false,
        error: `Server responded with status ${response.status}`,
        fallbackToMail: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network request failed',
        fallbackToMail: true,
      };
    }
  }

  /**
   * Opens the device default email client with prefilled feedback details as fallback.
   */
  public static async openMailtoFallback(data: FeedbackSubmissionData): Promise<boolean> {
    const subject = encodeURIComponent(
      `[User Feedback] [${data.category.toUpperCase()}] (${data.rating}★)`
    );

    let bodyText = `[User Feedback]\nCategory: ${data.category}\nRating: ${data.rating}/5\n\n[Content]\n${data.content.trim()}\n\n`;

    if (data.surveyQuestion && data.surveyAnswer) {
      bodyText += `[Survey]\nQ: ${data.surveyQuestion}\nA: ${data.surveyAnswer}\n\n`;
    }

    if (data.includeDevice) {
      const diag = this.getDeviceDiagnostics(data.language, data.isPro);
      bodyText += `[Diagnostics]\nOS: ${diag.os} (${diag.osVersion})\nApp Version: ${diag.appVersion}\nLanguage: ${diag.language}\nPro: ${diag.isPro ? 'Yes' : 'No'}\n`;
    }

    const body = encodeURIComponent(bodyText);
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}\n