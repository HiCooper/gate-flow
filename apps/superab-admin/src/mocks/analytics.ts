export interface StatsCards {
  totalPaywalls: number;
  activePaywalls: number;
  conversionRate: number;
  conversionDelta: number;
  mrr: number;
  mrrDelta: number;
  activeExperiments: number;
  experimentDelta: number;
}

export interface ConversionStep {
  name: string;
  value: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface RealTimeEvent {
  id: string;
  type: 'view' | 'trial' | 'conversion' | 'error';
  user: string;
  paywall: string;
  timestamp: string;
  details: string;
}

export interface TopPaywall {
  id: string;
  name: string;
  revenue: number;
  conversionRate: number;
  impressions: number;
}

export interface AnalyticsData {
  stats: StatsCards;
  funnel: ConversionStep[];
  revenueTimeSeries: RevenuePoint[];
  recentEvents: RealTimeEvent[];
  topPaywalls: TopPaywall[];
}

function generateRevenueData(): RevenuePoint[] {
  const data: RevenuePoint[] = [];
  const now = new Date('2026-05-05');
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const baseRevenue = dayOfWeek === 0 || dayOfWeek === 6 ? 8000 : 12000;
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseRevenue + Math.random() * 4000 - 2000),
    });
  }
  return data;
}

function generateRecentEvents(): RealTimeEvent[] {
  const events: RealTimeEvent[] = [
    { id: 'evt-001', type: 'conversion', user: 'user_8a3f2', paywall: '默认付费墙', timestamp: '2026-05-05T10:23:01Z', details: '年订阅 ¥298' },
    { id: 'evt-002', type: 'trial', user: 'user_2c7d1', paywall: '新用户引导页', timestamp: '2026-05-05T10:22:45Z', details: '7 天免费试用' },
    { id: 'evt-003', type: 'view', user: 'user_5e9b4', paywall: '全屏沉浸式付费墙', timestamp: '2026-05-05T10:22:30Z', details: 'iOS 16.4' },
    { id: 'evt-004', type: 'conversion', user: 'user_1a6f8', paywall: '游戏化付费墙', timestamp: '2026-05-05T10:22:12Z', details: '月订阅 ¥48' },
    { id: 'evt-005', type: 'error', user: 'user_9d4c7', paywall: '默认付费墙', timestamp: '2026-05-05T10:21:55Z', details: '支付超时，重试中' },
    { id: 'evt-006', type: 'trial', user: 'user_3b2e5', paywall: '教育类订阅页', timestamp: '2026-05-05T10:21:30Z', details: '14 天免费试用' },
    { id: 'evt-007', type: 'conversion', user: 'user_7f1a9', paywall: '高级功能解锁页', timestamp: '2026-05-05T10:21:15Z', details: '月订阅 ¥38' },
    { id: 'evt-008', type: 'view', user: 'user_4c8d6', paywall: '默认付费墙', timestamp: '2026-05-05T10:21:00Z', details: 'Android 14' },
  ];
  return events;
}

export const mockAnalytics: AnalyticsData = {
  stats: {
    totalPaywalls: 12,
    activePaywalls: 6,
    conversionRate: 8.4,
    conversionDelta: 2.1,
    mrr: 287600,
    mrrDelta: 12.5,
    activeExperiments: 3,
    experimentDelta: 1,
  },
  funnel: [
    { name: '展示', value: 45230 },
    { name: '浏览', value: 32150 },
    { name: '试用', value: 8540 },
    { name: '转化', value: 2847 },
  ],
  revenueTimeSeries: generateRevenueData(),
  recentEvents: generateRecentEvents(),
  topPaywalls: [
    { id: 'pw-010', name: '全屏沉浸式付费墙', revenue: 154300, conversionRate: 8.8, impressions: 38900 },
    { id: 'pw-001', name: '默认付费墙', revenue: 128400, conversionRate: 6.3, impressions: 45230 },
    { id: 'pw-006', name: '游戏化付费墙', revenue: 97200, conversionRate: 6.9, impressions: 31200 },
    { id: 'pw-008', name: '试用到期提醒页', revenue: 78900, conversionRate: 15.0, impressions: 28900 },
    { id: 'pw-002', name: '新用户引导页', revenue: 68400, conversionRate: 8.1, impressions: 18900 },
  ],
};
