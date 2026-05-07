export interface EditorLayer {
  id: string;
  type: 'text' | 'image' | 'button' | 'price-card' | 'feature-list' | 'trial-banner' | 'custom-html';
  props: Record<string, unknown>;
  children?: EditorLayer[];
}

export type PaywallStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface Paywall {
  id: string;
  name: string;
  description: string;
  status: PaywallStatus;
  template: string;
  platform: 'ios' | 'android' | 'react-native' | 'web' | 'all';
  conversions: number;
  impressions: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  layers: EditorLayer[];
}

export const mockPaywalls: Paywall[] = [
  {
    id: 'pw-001',
    name: '默认付费墙',
    description: '适用于所有用户的通用付费墙，包含三个订阅选项。',
    status: 'active',
    template: 'classic-3-tier',
    platform: 'all',
    conversions: 2847,
    impressions: 45230,
    revenue: 128400,
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-05-01T10:30:00Z',
    layers: [],
  },
  {
    id: 'pw-002',
    name: '新用户引导页',
    description: '针对首次打开应用的用户展示的引导型付费墙。',
    status: 'active',
    template: 'onboarding-flow',
    platform: 'ios',
    conversions: 1523,
    impressions: 18900,
    revenue: 68400,
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-04-28T14:00:00Z',
    layers: [],
  },
  {
    id: 'pw-003',
    name: '节日促销弹窗',
    description: '春节促销专用付费墙，限时折扣引导。',
    status: 'paused',
    template: 'seasonal-promo',
    platform: 'all',
    conversions: 3201,
    impressions: 28700,
    revenue: 56200,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-02-05T18:00:00Z',
    layers: [],
  },
  {
    id: 'pw-004',
    name: '高级功能解锁页',
    description: '在用户触发高级功能时展示的解锁付费墙。',
    status: 'active',
    template: 'feature-gate',
    platform: 'android',
    conversions: 987,
    impressions: 12300,
    revenue: 44500,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-05-02T09:00:00Z',
    layers: [],
  },
  {
    id: 'pw-005',
    name: '视频内容付费页',
    description: '面向视频流媒体的专属付费墙，突出内容价值。',
    status: 'draft',
    template: 'video-paywall',
    platform: 'web',
    conversions: 0,
    impressions: 0,
    revenue: 0,
    createdAt: '2026-05-01T11:00:00Z',
    updatedAt: '2026-05-03T16:00:00Z',
    layers: [],
  },
  {
    id: 'pw-006',
    name: '游戏化付费墙',
    description: '通过抽奖和奖励机制引导用户订阅。',
    status: 'active',
    template: 'gamified',
    platform: 'ios',
    conversions: 2156,
    impressions: 31200,
    revenue: 97200,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-04-15T12:00:00Z',
    layers: [],
  },
  {
    id: 'pw-007',
    name: '教育类订阅页',
    description: '面向在线教育产品的课程订阅付费墙。',
    status: 'active',
    template: 'education',
    platform: 'all',
    conversions: 876,
    impressions: 15600,
    revenue: 39200,
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-05-01T08:00:00Z',
    layers: [],
  },
  {
    id: 'pw-008',
    name: '试用到期提醒页',
    description: '免费试用期结束时的转化付费墙。',
    status: 'paused',
    template: 'trial-expired',
    platform: 'all',
    conversions: 4321,
    impressions: 28900,
    revenue: 78900,
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    layers: [],
  },
  {
    id: 'pw-009',
    name: '简洁轻量版',
    description: '极简设计，适合工具型和实用型应用。',
    status: 'draft',
    template: 'minimal',
    platform: 'react-native',
    conversions: 0,
    impressions: 0,
    revenue: 0,
    createdAt: '2026-04-28T14:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
    layers: [],
  },
  {
    id: 'pw-010',
    name: '全屏沉浸式付费墙',
    description: '全屏视频背景 + 动画效果的高转化付费墙。',
    status: 'active',
    template: 'immersive-fullscreen',
    platform: 'ios',
    conversions: 3421,
    impressions: 38900,
    revenue: 154300,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-05-03T11:00:00Z',
    layers: [],
  },
  {
    id: 'pw-011',
    name: '社交裂变付费页',
    description: '结合邀请奖励机制的分享型付费墙。',
    status: 'draft',
    template: 'social-referral',
    platform: 'all',
    conversions: 0,
    impressions: 0,
    revenue: 0,
    createdAt: '2026-05-04T09:00:00Z',
    updatedAt: '2026-05-04T09:00:00Z',
    layers: [],
  },
  {
    id: 'pw-012',
    name: '健康类订阅方案',
    description: '面向健身和健康类应用的周/月/年订阅付费墙。',
    status: 'archived',
    template: 'health-fitness',
    platform: 'android',
    conversions: 654,
    impressions: 23400,
    revenue: 28900,
    createdAt: '2025-10-15T08:00:00Z',
    updatedAt: '2026-02-28T18:00:00Z',
    layers: [],
  },
];
