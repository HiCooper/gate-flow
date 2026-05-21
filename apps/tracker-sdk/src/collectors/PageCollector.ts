import type { PageViewConfig, EventData } from '../types/EventTypes';

type PageViewCallback = (data: EventData) => void;

export class PageCollector {
  private config: Required<PageViewConfig>;
  private callback: PageViewCallback;
  private endpoint: string;
  private lastUrl: string = '';

  constructor(config: PageViewConfig, callback: PageViewCallback, endpoint: string) {
    this.config = {
      SPA: config.SPA ?? false,
      referrer: config.referrer ?? true,
    };
    this.callback = callback;
    this.endpoint = endpoint;
  }

  start(): void {
    // Listen for page load
    window.addEventListener('load', this.handlePageLoad);

    // Listen for visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Listen for beforeunload
    window.addEventListener('beforeunload', this.handleUnload);

    // SPA routing
    if (this.config.SPA) {
      this.interceptHistory();
      window.addEventListener('popstate', this.handleRouteChange);
    }

    // Initial page view
    this.lastUrl = window.location.href;
  }

  stop(): void {
    window.removeEventListener('load', this.handlePageLoad);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleUnload);
    window.removeEventListener('popstate', this.handleRouteChange);
  }

  private handlePageLoad = (): void => {
    this.reportPageView();
  };

  private handleRouteChange = (): void => {
    if (window.location.href !== this.lastUrl) {
      this.reportPageView();
      this.lastUrl = window.location.href;
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.reportPageView();
    }
  };

  private handleUnload = (): void => {
    const data = this.buildPageViewData();
    const blob = new Blob([JSON.stringify({ events: [data] })], { type: 'application/json' });
    navigator.sendBeacon?.(this.endpoint, blob);
  };

  private buildPageViewData(): EventData {
    const spmData = this.extractBodySpmData();
    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      ...spmData,
    };
  }

  private reportPageView(): void {
    this.callback(this.buildPageViewData());
  }

  private interceptHistory(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleRouteChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleRouteChange();
    };
  }

  private extractBodySpmData(): { spmCode?: string; spmLevel?: number } {
    const body = document.body;
    const spmAttr = body?.dataset?.trackSpm;
    if (spmAttr) {
      const parts = spmAttr.split('@');
      return {
        spmCode: parts[0] || undefined,
        spmLevel: parts[1] ? parseInt(parts[1]) : undefined,
      };
    }
    return {};
  }
