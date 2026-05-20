import type { ExposureConfig, EventData } from '../types/EventTypes';

type ExposureCallback = (data: EventData) => void;

export class ExposureCollector {
  private config: Required<ExposureConfig>;
  private callback: ExposureCallback;
  private observer: IntersectionObserver | null = null;
  private exposedElements: Map<Element, number> = new Map();

  constructor(config: ExposureConfig, callback: ExposureCallback) {
    this.config = {
      enabled: config.enabled ?? true,
      selector: config.selector ?? ['[data-exposure]'],
      threshold: config.threshold ?? 500,
      thresholdRatio: config.thresholdRatio ?? 0.5,
    };
    this.callback = callback;
  }

  start(): void {
    if (!this.config.enabled) return;

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: this.config.thresholdRatio,
        rootMargin: '0px',
      }
    );

    // Observe elements
    const elements = document.querySelectorAll(this.config.selector.join(','));
    console.log(`[Exposure] Observing ${elements.length} elements with selector: ${this.config.selector.join(', ')}`);
    elements.forEach((el) => this.observer?.observe(el));
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      const el = entry.target as HTMLElement;
      const trackId = el.dataset.trackId;

      // Element is visible and meets threshold - immediately send exposure event
      if (entry.isIntersecting && entry.intersectionRatio >= this.config.thresholdRatio) {
        // 只对首次曝光上报（避免重复曝光同一元素）
        if (!this.exposedElements.has(el)) {
          console.log(`[Exposure] Captured: ${trackId} (ratio: ${Math.round(entry.intersectionRatio * 100)}%)`);
          // Extract SPM data
          const spmData = this.extractSpmData(el);
          this.callback({
            elementId: trackId,
            elementType: el.tagName.toLowerCase(),
            elementText: el.textContent?.slice(0, 100) || '',
            exposureDuration: 0,
            exposureRatio: entry.intersectionRatio,
            ...spmData,
          });
          this.exposedElements.set(el, Date.now());
        }
      }
    });
  }

  private extractSpmData(element: HTMLElement): { spmCode?: string; spmLevel?: number } {
    const spmAttr = element.dataset.trackSpm;
    if (spmAttr) {
      const parts = spmAttr.split('@');
      return {
        spmCode: parts[0] || undefined,
        spmLevel: parts[1] ? parseInt(parts[1]) : undefined,
      };
    }
    return {};
  }
}
