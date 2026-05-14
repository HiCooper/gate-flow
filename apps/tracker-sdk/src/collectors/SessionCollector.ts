interface SessionInfo {
  sessionId: string;
  startTime: number;
  lastActiveTime: number;
  eventCount: number;
}

export class SessionCollector {
  private sessionId: string;
  private startTime: number;
  private lastActiveTime: number;
  private eventCount: number = 0;

  // Session timeout: 30 minutes
  private readonly TIMEOUT_MS = 30 * 60 * 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.lastActiveTime = this.startTime;
  }

  start(): void {
    // Listen for visibility changes to track activity
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Heartbeat to refresh lastActiveTime
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.recordActivity();
      }
    }, 30000);
  }

  stop(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  getSessionInfo(): SessionInfo {
    // Check for timeout
    if (Date.now() - this.lastActiveTime > this.TIMEOUT_MS) {
      // Create new session
      this.sessionId = this.generateSessionId();
      this.startTime = Date.now();
      this.lastActiveTime = this.startTime;
      this.eventCount = 0;
    }

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      lastActiveTime: this.lastActiveTime,
      eventCount: this.eventCount,
    };
  }

  recordActivity(): void {
    this.lastActiveTime = Date.now();
    this.eventCount++;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.recordActivity();
    }
  };
}
