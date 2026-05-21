import type { TrackerConfig, EventDTO, EventType, EventData, ContextData } from '../types/EventTypes';
import { PageCollector } from '../collectors/PageCollector';
import { ClickCollector } from '../collectors/ClickCollector';
import { ExposureCollector } from '../collectors/ExposureCollector';
import { ScrollCollector } from '../collectors/ScrollCollector';
import { SessionCollector } from '../collectors/SessionCollector';
import { EventQueue } from '../queue/EventQueue';
import { Sender } from '../sender/Sender';

// High-priority event types that require immediate reporting
const IMMEDIATE_EVENT_TYPES: EventType[] = ['exposure', 'click'];

export class Tracker {
  private config: Required<TrackerConfig>;
  private queue: EventQueue;
  private sender: Sender;
  private collectors: Set<{ start: () => void; stop: () => void }> = new Set();

  constructor(config: TrackerConfig) {
    this.config = {
      endpoint: config.endpoint,
      appId: config.appId,
      autoTrack: config.autoTrack ?? {},
      batch: config.batch ?? { maxSize: 50, interval: 2000 },
      offline: config.offline ?? { enabled: true, maxQueueSize: 100 },
    };

    // Initialize queue and sender
    this.queue = new EventQueue(this.config.offline);
    this.sender = new Sender(this.config.endpoint, this.queue);

    // Initialize session collector
    const sessionCollector = new SessionCollector();
    this.collectors.add(sessionCollector);

    // Initialize auto collectors based on config
    if (this.config.autoTrack.pageView) {
      const pageConfig = typeof this.config.autoTrack.pageView === 'object'
        ? this.config.autoTrack.pageView : {};
      const pageCollector = new PageCollector(pageConfig, (data) => this.track('page_view', data), this.config.endpoint);
      this.collectors.add(pageCollector);
    }

    if (this.config.autoTrack.click) {
      const clickConfig = typeof this.config.autoTrack.click === 'object'
        ? this.config.autoTrack.click : { enabled: true };
      const clickCollector = new ClickCollector(
        { enabled: true, ...clickConfig },
        (data) => this.track('click', data)
      );
      this.collectors.add(clickCollector);
    }

    if (this.config.autoTrack.exposure) {
      const exposureConfig = typeof this.config.autoTrack.exposure === 'object'
        ? this.config.autoTrack.exposure : { enabled: true };
      const exposureCollector = new ExposureCollector(
        { enabled: true, threshold: 500, ...exposureConfig },
        (data) => this.track('exposure', data)
      );
      this.collectors.add(exposureCollector);
    }

    if (this.config.autoTrack.scroll) {
      const scrollConfig = typeof this.config.autoTrack.scroll === 'object'
        ? this.config.autoTrack.scroll : { enabled: true };
      const scrollCollector = new ScrollCollector(
        { enabled: true, thresholds: [25, 50, 75, 100], ...scrollConfig },
        (data) => this.track('scroll', data)
      );
      this.collectors.add(scrollCollector);
    }

    // Start sender
    this.sender.start(this.config.batch);
  }

  init(): void {
    console.log('[Tracker] Initializing with config:', {
      endpoint: this.config.endpoint,
      appId: this.config.appId,
      autoTrack: this.config.autoTrack,
      batch: this.config.batch,
      offline: this.config.offline,
    });

    // Start all collectors
    this.collectors.forEach((c) => {
      console.log('[Tracker] Starting collector:', c.constructor.name);
      c.start();
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      console.log('[Tracker] Network online, flushing queue');
      this.queue.flush(this.config.endpoint);
    });

    console.log('[Tracker] Initialization complete');
  }

  track(eventType: EventType, data?: EventData): void {
    const event = this.buildEvent(eventType, data);
    console.log(`[Tracker] Event captured: ${eventType}`, event);

    // Record session activity on every tracked event
    const sessionCollector = Array.from(this.collectors)
      .find((c) => c instanceof SessionCollector) as SessionCollector | undefined;
    sessionCollector?.recordActivity();

    if (IMMEDIATE_EVENT_TYPES.includes(eventType)) {
      // High-priority events: send immediately, only enqueue on failure
      this.queue.flushImmediate(event, this.config.endpoint).catch(() => {
        this.queue.enqueue(event);
      });
    } else {
      // Normal events: enqueue for batch sending
      this.queue.enqueue(event);
    }
  }

  trackPageView(page: { url?: string; title?: string; referrer?: string }): void {
    this.track('page_view', {
      ...page,
    });
  }

  trackClick(element: Element, data?: EventData): void {
    const rect = element.getBoundingClientRect();
    const position = {
      clickX: Math.round(rect.x + rect.width / 2),
      clickY: Math.round(rect.y + rect.height / 2),
    };

    this.track('click', {
      elementId: (element as HTMLElement).dataset?.track || element.id,
      elementType: element.tagName.toLowerCase(),
      elementText: element.textContent?.slice(0, 100) || '',
      ...position,
      ...data,
    });
  }

  trackExposure(element: Element, data?: EventData): void {
    this.track('exposure', {
      elementId: (element as HTMLElement).dataset?.exposure || element.id,
      elementType: element.tagName.toLowerCase(),
      elementText: element.textContent?.slice(0, 100) || '',
      ...data,
    });
  }

  async flush(): Promise<void> {
    await this.queue.flush(this.config.endpoint);
  }

  destroy(): void {
    this.collectors.forEach((c) => c.stop());
    this.sender.stop();
  }

  private buildEvent(eventType: EventType, data?: EventData): EventDTO {
    const sessionCollector = Array.from(this.collectors)
      .find((c) => c instanceof SessionCollector) as SessionCollector | undefined;
    const sessionInfo = sessionCollector?.getSessionInfo();

    return {
      eventId: this.generateEventId(),
      eventType,
      userId: this.getUserId(),
      anonymousId: this.getAnonymousId(),
      timestamp: Date.now(),
      clientTime: Date.now(),
      platform: 'web',
      appVersion: this.config.appId,
      sdkVersion: '1.0.0',
      page: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
      session: sessionInfo
        ? { sessionId: sessionInfo.sessionId, startTime: sessionInfo.startTime }
        : undefined,
      device: {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
      },
      context: this.parseUTM(),
      data,
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private getUserId(): string | undefined {
    // TODO: Integrate with GateFlow SDK for userId
    return undefined;
  }

  private getAnonymousId(): string {
    const key = 'gf_anonymous_id';
    let anonymousId = localStorage.getItem(key);
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(key, anonymousId);
    }
    return anonymousId;
  }

  private parseUTM(): ContextData {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined,
    };
  }
}

export default Tracker;
