export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'paused';

export type PrimaryMetric = 'conversion_rate' | 'revenue' | 'trial_start' | 'retention_d7';

export interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface StatisticalResult {
  pValue: number;
  lift: number; // percentage, e.g., +15.2 or -8.3
  liftDirection: 'positive' | 'negative' | 'neutral';
  isSignificant: boolean;
  confidenceLevel: number; // 95, 90, etc.
  ciLower: number; // confidence interval lower bound
  ciUpper: number; // confidence interval upper bound
  sampleRatioMismatch: boolean; // SRM test result
}

export interface Variant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  conversionRate: number;
  impressions: number;
  conversions: number;
  trafficPercentage: number;
  isControl: boolean;
}

export interface ExperimentResults {
  winner?: string;
  confidence: number;
  totalImpressions: number;
  totalConversions: number;
  statistical?: StatisticalResult;
}

export interface Experiment {
  id: string;
  name: string;
  paywallId: string;
  paywallName: string;
  status: ExperimentStatus;
  hypothesis: string;
  primaryMetric: PrimaryMetric;
  targetingRules: TargetingRule[];
  startDate: string;
  endDate?: string;
  variants: Variant[];
  trafficAllocation: number;
  results: ExperimentResults;
  createdAt: string;
}

export const mockExperiments: Experiment[] = [
  {
    id: 'exp-001',
    name: '定价对比测试：¥38 vs ¥48',
    paywallId: 'pw-001',
    paywallName: '默认付费墙',
    status: 'running',
    hypothesis: '将月度订阅价格从 ¥38 调整到 ¥48 不会显著降低转化率，但会提升 ARPU。',
    primaryMetric: 'conversion_rate',
    targetingRules: [
      { attribute: 'country', operator: 'equals', value: 'CN' },
      { attribute: 'app_version', operator: 'greater_than', value: '2.0' },
    ],
    startDate: '2026-04-20T00:00:00Z',
    variants: [
      {
        id: 'var-001-a',
        name: '对照组 ¥38/月',
        config: { monthlyPrice: 38 },
        conversionRate: 12.8,
        impressions: 5600,
        conversions: 717,
        trafficPercentage: 50,
        isControl: true,
      },
      {
        id: 'var-001-b',
        name: '实验组 ¥48/月',
        config: { monthlyPrice: 48 },
        conversionRate: 11.2,
        impressions: 5600,
        conversions: 627,
        trafficPercentage: 50,
        isControl: false,
      },
    ],
    trafficAllocation: 100,
    results: {
      confidence: 89.5,
      totalImpressions: 11200,
      totalConversions: 1344,
      statistical: {
        pValue: 0.082,
        lift: -12.5,
        liftDirection: 'negative',
        isSignificant: false,
        confidenceLevel: 95,
        ciLower: -21.3,
        ciUpper: -3.7,
        sampleRatioMismatch: false,
      },
    },
    createdAt: '2026-04-19T10:00:00Z',
  },
  {
    id: 'exp-002',
    name: '文案 A/B 测试：功能导向 vs 情感导向',
    paywallId: 'pw-002',
    paywallName: '新用户引导页',
    status: 'completed',
    hypothesis: '情感导向的文案比功能列表更能打动新用户，提升首次订阅转化。',
    primaryMetric: 'conversion_rate',
    targetingRules: [
      { attribute: 'is_new_user', operator: 'equals', value: 'true' },
      { attribute: 'days_since_install', operator: 'less_than', value: 7 },
    ],
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-04-15T00:00:00Z',
    variants: [
      {
        id: 'var-002-a',
        name: '功能导向文案',
        config: { copyStyle: 'functional' },
        conversionRate: 9.5,
        impressions: 4200,
        conversions: 399,
        trafficPercentage: 50,
        isControl: true,
      },
      {
        id: 'var-002-b',
        name: '情感导向文案',
        config: { copyStyle: 'emotional' },
        conversionRate: 14.2,
        impressions: 4200,
        conversions: 596,
        trafficPercentage: 50,
        isControl: false,
      },
    ],
    trafficAllocation: 100,
    results: {
      winner: 'var-002-b',
      confidence: 97.3,
      totalImpressions: 8400,
      totalConversions: 995,
      statistical: {
        pValue: 0.003,
        lift: 49.5,
        liftDirection: 'positive',
        isSignificant: true,
        confidenceLevel: 95,
        ciLower: 32.1,
        ciUpper: 67.9,
        sampleRatioMismatch: false,
      },
    },
    createdAt: '2026-03-31T08:00:00Z',
  },
  {
    id: 'exp-003',
    name: '设计风格测试：暗色 vs 亮色主题',
    paywallId: 'pw-006',
    paywallName: '游戏化付费墙',
    status: 'running',
    hypothesis: '暗色主题在游戏类应用中更受欢迎，提升沉浸感和转化率。',
    primaryMetric: 'conversion_rate',
    targetingRules: [
      { attribute: 'app_category', operator: 'equals', value: 'games' },
      { attribute: 'device_type', operator: 'equals', value: 'mobile' },
    ],
    startDate: '2026-04-25T00:00:00Z',
    variants: [
      {
        id: 'var-003-a',
        name: '暗色主题',
        config: { theme: 'dark' },
        conversionRate: 16.3,
        impressions: 3800,
        conversions: 619,
        trafficPercentage: 50,
        isControl: true,
      },
      {
        id: 'var-003-b',
        name: '亮色主题',
        config: { theme: 'light' },
        conversionRate: 10.7,
        impressions: 3800,
        conversions: 407,
        trafficPercentage: 50,
        isControl: false,
      },
    ],
    trafficAllocation: 100,
    results: {
      confidence: 99.1,
      totalImpressions: 7600,
      totalConversions: 1026,
      statistical: {
        pValue: 0.001,
        lift: 52.3,
        liftDirection: 'positive',
        isSignificant: true,
        confidenceLevel: 95,
        ciLower: 38.7,
        ciUpper: 65.9,
        sampleRatioMismatch: false,
      },
    },
    createdAt: '2026-04-24T14:00:00Z',
  },
  {
    id: 'exp-004',
    name: 'CTA 按钮测试：免费试用 vs 立即订阅',
    paywallId: 'pw-010',
    paywallName: '全屏沉浸式付费墙',
    status: 'paused',
    hypothesis: '免费试用按钮可以降低用户的心理门槛，提高初始转化率。',
    primaryMetric: 'trial_start',
    targetingRules: [
      { attribute: 'country', operator: 'not_equals', value: 'US' },
    ],
    startDate: '2026-04-10T00:00:00Z',
    variants: [
      {
        id: 'var-004-a',
        name: '立即订阅',
        config: { ctaText: '立即订阅' },
        conversionRate: 8.9,
        impressions: 6200,
        conversions: 552,
        trafficPercentage: 50,
        isControl: true,
      },
      {
        id: 'var-004-b',
        name: '免费试用',
        config: { ctaText: '免费试用 7 天' },
        conversionRate: 15.6,
        impressions: 6200,
        conversions: 967,
        trafficPercentage: 50,
        isControl: false,
      },
    ],
    trafficAllocation: 100,
    results: {
      winner: 'var-004-b',
      confidence: 99.8,
      totalImpressions: 12400,
      totalConversions: 1519,
      statistical: {
        pValue: 0.0001,
        lift: 75.3,
        liftDirection: 'positive',
        isSignificant: true,
        confidenceLevel: 95,
        ciLower: 62.1,
        ciUpper: 88.5,
        sampleRatioMismatch: false,
      },
    },
    createdAt: '2026-04-09T09:00:00Z',
  },
  {
    id: 'exp-005',
    name: '多变量测试：价格+文案+设计组合',
    paywallId: 'pw-001',
    paywallName: '默认付费墙',
    status: 'draft',
    hypothesis: '综合优化价格、文案和设计可以找到最优组合，实现最大转化提升。',
    primaryMetric: 'conversion_rate',
    targetingRules: [],
    startDate: '2026-05-10T00:00:00Z',
    variants: [
      {
        id: 'var-005-a',
        name: '当前版本（基准）',
        config: { price: 38, copyStyle: 'functional', theme: 'dark' },
        conversionRate: 0,
        impressions: 0,
        conversions: 0,
        trafficPercentage: 25,
        isControl: true,
      },
      {
        id: 'var-005-b',
        name: '情感文案 + 暗色',
        config: { price: 38, copyStyle: 'emotional', theme: 'dark' },
        conversionRate: 0,
        impressions: 0,
        conversions: 0,
        trafficPercentage: 25,
        isControl: false,
      },
      {
        id: 'var-005-c',
        name: '功能文案 + 亮色 + ¥48',
        config: { price: 48, copyStyle: 'functional', theme: 'light' },
        conversionRate: 0,
        impressions: 0,
        conversions: 0,
        trafficPercentage: 25,
        isControl: false,
      },
      {
        id: 'var-005-d',
        name: '情感文案 + 亮色 + ¥48',
        config: { price: 48, copyStyle: 'emotional', theme: 'light' },
        conversionRate: 0,
        impressions: 0,
        conversions: 0,
        trafficPercentage: 25,
        isControl: false,
      },
    ],
    trafficAllocation: 50,
    results: {
      confidence: 0,
      totalImpressions: 0,
      totalConversions: 0,
    },
    createdAt: '2026-05-03T08:00:00Z',
  },
];