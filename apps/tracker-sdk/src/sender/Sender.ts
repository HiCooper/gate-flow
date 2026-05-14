import type { BatchConfig } from '../types/EventTypes';
import { EventQueue } from '../queue/EventQueue';

export class Sender {
  private endpoint: string;
  private queue: EventQueue;
  private timer: number | null = null;
  private config!: Required<BatchConfig>;

  constructor(endpoint: string, queue: EventQueue) {
    this.endpoint = endpoint;
    this.queue = queue;
  }

  start(config: BatchConfig): void {
    this.config = {
      maxSize: config.maxSize ?? 50,
      interval: config.interval ?? 2000,
    };

    // Start periodic flush
    this.timer = window.setInterval(() => {
      this.flush();
    }, this.config.interval);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async flush(): Promise<void> {
    if (this.queue.size() >= this.config.maxSize) {
      await this.queue.flush(this.endpoint);
    }
  }
}
