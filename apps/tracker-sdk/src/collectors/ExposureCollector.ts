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

    // Observe elements with data-exposure attribute
    const elements = document.querySelectorAll(this.config.selector.join(','));
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

      if (entry.isIntersecting) {
        // Element became visible - record start time
        el.dataset.exposureStart = Date.now().toString();
        this.exposedElements.set(el, Date.now());
      } else if (el.dataset.exposureStart) {
        // Element became hidden - calculate duration and send event
        const startTime = parseInt(el.dataset.exposureStart, 10);
        const duration = Date.now() - startTime;

        if (duration >= this.config.threshold) {
          this.callback({
            elementId: trackId,
            elementType: el.tagName.toLowerCase(),
            elementText: el.textContent?.slice(0, 100) || '',
            exposureDuration: duration,
            exposureRatio: entry.intersectionRatio,
          });
        }

        delete el.dataset.exposureStart;
        this.exposedElements.delete(el);
      }
    });
  }
}
