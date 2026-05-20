import type { PageViewConfig, EventData } from '../types/EventTypes';

type PageViewCallback = (data: EventData) => void;

export class PageCollector {
  private config: Required<PageViewConfig>;
  private callback: PageViewCallback;
  private lastUrl: string = '';

  constructor(config: PageViewConfig, callback: PageViewCallback) {
    this.config = {
      SPA: config.SPA ?? false,
      referrer: config.referrer ?? true,
    };
    this.callback = callback;
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
    // Report on unload
    navigator.sendBeacon?.(this.buildBeaconUrl());
  };

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

  private reportPageView(): void {
    // Extract SPM data from body element (app-level SPM)
    const spmData = this.extractBodySpmData();
    this.callback({
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      ...spmData,
    });
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

  private buildBeaconUrl(): string {
    // TODO: Implement beacon for reliable unload reporting
    return '';
  }
}
