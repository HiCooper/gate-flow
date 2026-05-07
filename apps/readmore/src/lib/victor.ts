import type { UserInitResponse, EventTag } from './api';
import { initUser, reportEvent } from './api';

class VictorManager {
  private userId: string | null = null;
  private variants: Record<string, string> = {};
  private experimentTags: EventTag[] = [];

  async initialize(): Promise<UserInitResponse> {
    const stored = localStorage.getItem('rm_user_id');
    const data = await initUser(stored || undefined);
    this.userId = data.userId;
    this.variants = data.variants;
    this.experimentTags = data.experimentTags;
    localStorage.setItem('rm_user_id', data.userId);
    return data;
  }

  getUserId(): string {
    if (!this.userId) throw new Error('Victor not initialized');
    return this.userId;
  }

  getVariant(expKey: string): string | undefined {
    return this.variants[expKey];
  }

  getParam<T>(expKey: string, _paramKey: string, defaultValue: T): T {
    const variant = this.variants[expKey];
    if (!variant) return defaultValue;
    return defaultValue;
  }

  getTags(): EventTag[] {
    return this.experimentTags;
  }

  async trackEvent(eventType: string, properties: Record<string, unknown> = {}) {
    if (!this.userId) return;
    return reportEvent(eventType, this.userId, this.experimentTags, properties);
  }
}

export const victor = new VictorManager();
