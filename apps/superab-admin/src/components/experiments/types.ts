import { Experiment, Variant } from '../../api/experimentApi';

export type ExperimentStatus = 'draft' | 'review' | 'ramp' | 'running' | 'paused' | 'analyzing' | 'decision' | 'archive';
export type PrimaryMetric = 'conversion_rate' | 'revenue' | 'trial_start' | 'retention_d7';

export interface StatisticalResult {
  isSignificant: boolean;
  liftDirection: 'positive' | 'negative' | 'neutral';
  lift: number;
  ciLower: number;
  ciUpper: number;
  pValue: number;
  liftPercent: number;
}

export interface ExperimentUI {
  id: string;
  name: string;
  paywallId: string;
  paywallName: string;
  status: ExperimentStatus;
  hypothesis: string;
  primaryMetric: string;
  targetingRules: Array<{
    attribute: string;
    operator: string;
    value: string | number;
  }>;
  startDate: string;
  variants: VariantUI[];
  trafficAllocation: number;
  results: {
    confidence: number;
    totalImpressions: number;
    totalConversions: number;
    winner?: string;
    statistical?: StatisticalResult;
  };
  createdAt: string;
}

export interface VariantUI {
  id: string;
  name: string;
  config: Record<string, any>;
  conversionRate: number;
  impressions: number;
  conversions: number;
  trafficPercentage: number;
  isControl: boolean;
}

export const statusLabel: Record<ExperimentStatus, string> = {
  draft: '草稿',
  review: '待审核',
  ramp: '渐进上线',
  running: '运行中',
  paused: '已暂停',
  analyzing: '分析中',
  decision: '决策阶段',
  archive: '已归档',
};

export const metricLabel: Record<string, string> = {
  conversion_rate: '转化率',
  revenue: '收入',
  trial_start: '试用开始',
  retention_d7: '7日留存',
};
