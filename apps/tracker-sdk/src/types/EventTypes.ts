export interface EventDTO {
  eventId: string;
  eventType: string;
  userId?: string;
  anonymousId?: string;
  timestamp: number;
  clientTime?: number;
  platform?: string;
  appVersion?: string;
  sdkVersion?: string;
  page?: PageData;
  session?: SessionData;
  device?: DeviceData;
  context?: ContextData;
  data?: EventData;
}

export interface PageData {
  url: string;
  title?: string;
  referrer?: string;
}

export interface SessionData {
  sessionId: string;
  startTime?: number;
}

export interface DeviceData {
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
}

export interface ContextData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface EventData {
  scrollDepth?: number;
  stayDuration?: number;
  elementId?: string;
  elementType?: string;
  elementText?: string;
  clickX?: number;
  clickY?: number;
  exposureDuration?: number;
  exposureRatio?: number;
  spmCode?: string;  // SPM点位编码
  spmLevel?: number; // SPM层级 (0-3)
  [key: string]: unknown;
}

export interface TrackerConfig {
  appId: string;
  endpoint: string;
  autoTrack?: AutoTrackConfig;
  batch?: BatchConfig;
  offline?: OfflineConfig;
}

export interface AutoTrackConfig {
  pageView?: boolean | PageViewConfig;
  click?: boolean | ClickConfig;
  exposure?: boolean | ExposureConfig;
  scroll?: boolean | ScrollConfig;
  stay?: boolean | StayConfig;
}

export interface PageViewConfig {
  SPA?: boolean;
  referrer?: boolean;
}

export interface ClickConfig {
  enabled?: boolean;
  selector?: string[];
  excludeSelector?: string[];
  trackText?: boolean;
  trackPosition?: boolean;
}

export interface ExposureConfig {
  enabled?: boolean;
  selector?: string[];
  threshold?: number;
  thresholdRatio?: number;
}

export interface ScrollConfig {
  enabled?: boolean;
  thresholds?: number[];
  throttle?: number;
}

export interface StayConfig {
  enabled?: boolean;
  threshold?: number;
}

export interface BatchConfig {
  maxSize?: number;
  interval?: number;
}

export interface OfflineConfig {
  enabled?: boolean;
  maxQueueSize?: number;
}

export type EventType =
  | 'page_view'
  | 'click'
  | 'exposure'
  | 'scroll'
  | 'stay'
  | 'custom'
  | 'session_start'
  | 'session_end'
  | 'session_heartbeat';
