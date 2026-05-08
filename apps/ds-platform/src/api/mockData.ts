import type {
  Experiment,
  ExperimentSummary,
  DashboardStats,
  SRMCheckResult,
  TrafficDiagnosis,
  TrafficAlert,
  ExperimentReport,
  ReportJob,
  MetricResult,
  RealtimeMetrics,
} from '../types';

// ============================================
// Mock Experiments
// ============================================

export const mockExperiments: Experiment[] = [
  {
    id: '1',
    expKey: 'exp_homepage_cta_001',
    name: '首页 CTA 按钮优化实验',
    description: '测试新样式 CTA 按钮对点击率的影响',
    status: 'running',
    layerId: 1,
    bucketStart: 0,
    bucketEnd: 99,
    startTime: '2024-01-15T08:00:00Z',
    createdBy: 'zhangsan',
    tags: ['首页', 'CTA', 'CTR'],
    primaryMetric: 'ctr',
    guardrailMetrics: ['page_load_time', 'bounce_rate'],
    variants: [
      {
        id: 'v1',
        variantKey: 'control',
        name: '对照组',
        bucketStart: 0,
        bucketEnd: 49,
        isControl: true,
        trafficPercent: 50,
        metrics: {
          exposurePv: 125000,
          exposureUv: 98000,
          clickPv: 4000,
          clickUv: 3200,
          conversions: 15600,
          conversionRate: 3.2,
          revenue: 156000,
          avgRevenuePerUser: 1.25,
        },
      },
      {
        id: 'v2',
        variantKey: 'treatment',
        name: '实验组',
        bucketStart: 50,
        bucketEnd: 99,
        isControl: false,
        trafficPercent: 50,
        metrics: {
          exposurePv: 128000,
          exposureUv: 102000,
          clickPv: 4672,
          clickUv: 3738,
          conversions: 18624,
          conversionRate: 3.65,
          revenue: 186240,
          avgRevenuePerUser: 1.45,
        },
      },
    ],
  },
  {
    id: '2',
    expKey: 'exp_search_ranking_002',
    name: '搜索排序算法优化',
    description: '引入新排序因子优化搜索结果相关性',
    status: 'running',
    layerId: 1,
    bucketStart: 0,
    bucketEnd: 99,
    startTime: '2024-01-20T00:00:00Z',
    createdBy: 'lisi',
    tags: ['搜索', '排序', '相关性'],
    primaryMetric: 'ctr',
    guardrailMetrics: ['search_latency'],
    variants: [
      {
        id: 'v1',
        variantKey: 'control',
        name: '对照组',
        bucketStart: 0,
        bucketEnd: 49,
        isControl: true,
        trafficPercent: 50,
        metrics: {
          exposurePv: 85000,
          exposureUv: 72000,
          clickPv: 2550,
          clickUv: 2040,
          conversions: 10200,
          conversionRate: 3.0,
          revenue: 102000,
          avgRevenuePerUser: 1.2,
        },
      },
      {
        id: 'v2',
        variantKey: 'treatment',
        name: '实验组 A',
        bucketStart: 50,
        bucketEnd: 74,
        isControl: false,
        trafficPercent: 25,
        metrics: {
          exposurePv: 42000,
          exposureUv: 38000,
          clickPv: 1365,
          clickUv: 1092,
          conversions: 5460,
          conversionRate: 3.25,
          revenue: 54600,
          avgRevenuePerUser: 1.3,
        },
      },
      {
        id: 'v3',
        variantKey: 'treatment_b',
        name: '实验组 B',
        bucketStart: 75,
        bucketEnd: 99,
        isControl: false,
        trafficPercent: 25,
        metrics: {
          exposurePv: 43000,
          exposureUv: 39000,
          clickPv: 1505,
          clickUv: 1204,
          conversions: 6020,
          conversionRate: 3.5,
          revenue: 60200,
          avgRevenuePerUser: 1.4,
        },
      },
    ],
  },
  {
    id: '3',
    expKey: 'exp_checkout_flow_003',
    name: ' checkout 流程优化',
    description: '简化下单流程，提升转化率',
    status: 'completed',
    layerId: 2,
    bucketStart: 0,
    bucketEnd: 99,
    startTime: '2023-12-01T00:00:00Z',
    endTime: '2024-01-05T00:00:00Z',
    createdBy: 'wangwu',
    tags: [' checkout', '转化率'],
    primaryMetric: 'conversion_rate',
    guardrailMetrics: ['order_value', 'cart_abandonment'],
    variants: [
      {
        id: 'v1',
        variantKey: 'control',
        name: '对照组',
        bucketStart: 0,
        bucketEnd: 50,
        isControl: true,
        trafficPercent: 51,
        metrics: {
          exposurePv: 500000,
          exposureUv: 450000,
          clickPv: 50000,
          clickUv: 45000,
          conversions: 45000,
          conversionRate: 9.0,
          revenue: 4500000,
          avgRevenuePerUser: 9.0,
        },
      },
      {
        id: 'v2',
        variantKey: 'treatment',
        name: '实验组',
        bucketStart: 51,
        bucketEnd: 99,
        isControl: false,
        trafficPercent: 49,
        metrics: {
          exposurePv: 490000,
          exposureUv: 440000,
          clickPv: 53900,
          clickUv: 48510,
          conversions: 53900,
          conversionRate: 11.0,
          revenue: 5390000,
          avgRevenuePerUser: 11.0,
        },
      },
    ],
  },
  {
    id: '4',
    expKey: 'exp_recommendation_v2',
    name: '推荐算法 v2 升级',
    description: '引入深度学习模型优化推荐效果',
    status: 'paused',
    layerId: 3,
    bucketStart: 0,
    bucketEnd: 99,
    startTime: '2024-01-10T00:00:00Z',
    createdBy: 'zhaoliu',
    tags: ['推荐', '深度学习'],
    primaryMetric: 'ctr',
    guardrailMetrics: ['ctr', 'diversity'],
    variants: [
      {
        id: 'v1',
        variantKey: 'control',
        name: '对照组',
        bucketStart: 0,
        bucketEnd: 50,
        isControl: true,
        trafficPercent: 50,
        metrics: {
          exposurePv: 200000,
          exposureUv: 180000,
          clickPv: 24000,
          clickUv: 21600,
          conversions: 24000,
          conversionRate: 12.0,
          revenue: 240000,
          avgRevenuePerUser: 1.2,
        },
      },
      {
        id: 'v2',
        variantKey: 'treatment',
        name: '实验组',
        bucketStart: 51,
        bucketEnd: 99,
        isControl: false,
        trafficPercent: 49,
        metrics: {
          exposurePv: 195000,
          exposureUv: 175000,
          clickPv: 25350,
          clickUv: 22815,
          conversions: 25350,
          conversionRate: 13.0,
          revenue: 253500,
          avgRevenuePerUser: 1.3,
        },
      },
    ],
  },
];

// ============================================
// Mock Experiment Summaries
// ============================================

export const mockExperimentSummaries: ExperimentSummary[] = mockExperiments.map((exp) => {
  const control = exp.variants.find((v) => v.isControl);
  const treatment = exp.variants.find((v) => !v.isControl);
  
  const controlRate = control?.metrics?.conversionRate || 0;
  const treatmentRate = treatment?.metrics?.conversionRate || 0;
  const lift = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;
  
  return {
    id: exp.id,
    name: exp.name,
    status: exp.status,
    startTime: exp.startTime,
    primaryMetric: exp.primaryMetric,
    lift,
    pValue: exp.status === 'running' ? Math.random() * 0.1 : 0.02,
    isSignificant: exp.status === 'completed' && lift > 0,
    hasSRM: exp.id === '2', // 搜索实验有 SRM 问题
    guardrailPassed: true,
  };
});

// ============================================
// Mock Dashboard Stats
// ============================================

export const mockDashboardStats: DashboardStats = {
  totalExperiments: 156,
  activeExperiments: 12,
  completedThisWeek: 8,
  significantPositive: 5,
  significantNegative: 2,
  pendingReports: 3,
  srmAlerts: 2,
  dataDelays: 1,
};

// ============================================
// Mock SRM Check Results
// ============================================

export const mockSRMCheckPassed: SRMCheckResult = {
  passed: true,
  hasSRM: false,
  chiSquareStat: 1.23,
  pValue: 0.267,
  expectedRatio: '50:50',
  actualRatio: '49.8:50.2',
  variantCounts: [
    {
      variantKey: 'control',
      variantName: '对照组',
      expectedCount: 50000,
      actualCount: 49900,
      deviation: -0.2,
    },
    {
      variantKey: 'treatment',
      variantName: '实验组',
      expectedCount: 50000,
      actualCount: 50100,
      deviation: 0.2,
    },
  ],
  severity: 'none',
  possibleCauses: [],
  recommendation: 'SRM 检验通过，样本分配均匀，可以信赖实验结果。',
};

export const mockSRMCheckFailed: SRMCheckResult = {
  passed: false,
  hasSRM: true,
  chiSquareStat: 156.78,
  pValue: 0.0001,
  expectedRatio: '50:50',
  actualRatio: '45:55',
  variantCounts: [
    {
      variantKey: 'control',
      variantName: '对照组',
      expectedCount: 50000,
      actualCount: 45000,
      deviation: -10.0,
    },
    {
      variantKey: 'treatment',
      variantName: '实验组 A',
      expectedCount: 25000,
      actualCount: 27500,
      deviation: 10.0,
    },
    {
      variantKey: 'treatment_b',
      variantName: '实验组 B',
      expectedCount: 25000,
      actualCount: 27500,
      deviation: 10.0,
    },
  ],
  severity: 'critical',
  possibleCauses: [
    '分流服务配置错误',
    '实验组代码存在异常导致部分用户被排除',
    '用户属性分布不均匀',
  ],
  recommendation: '检测到严重的 SRM 问题，实验结果不可信。请检查分流配置和实验代码后重新开始实验。',
};

// ============================================
// Mock Traffic Diagnosis
// ============================================

export const mockTrafficDiagnosis: TrafficDiagnosis = {
  experimentId: '2',
  experimentName: '搜索排序算法优化',
  overallHealth: 'critical',
  srmCheck: mockSRMCheckFailed,
  trafficTrend: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    variantKey: 'control',
    sampleSize: 45000 + Math.floor(Math.random() * 5000),
    ratio: 0.45 + Math.random() * 0.02,
  })),
  anomalyAlerts: [
    {
      id: 'alert-1',
      type: 'srm_detected',
      severity: 'critical',
      title: '样本比例严重不匹配 (SRM)',
      description: '检测到实验组和对照组样本比例偏离预期超过 10%，实验结果不可信。',
      detectedAt: new Date().toISOString(),
      experimentId: '2',
    },
    {
      id: 'alert-2',
      type: 'traffic_spike',
      severity: 'warning',
      title: '流量突然增加',
      description: '过去 1 小时内流量增加了 25%，可能是外部流量或爬虫。',
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      experimentId: '2',
    },
  ],
  recommendations: [
    {
      priority: 'high',
      action: '立即停止实验',
      reason: 'SRM 问题严重，实验结果不可信',
    },
    {
      priority: 'high',
      action: '排查分流配置',
      reason: '检查是否有配置错误导致分流不均',
    },
    {
      priority: 'medium',
      action: '检查实验代码',
      reason: '排除代码逻辑导致的用户排除',
    },
  ],
};

// ============================================
// Mock Metric Results
// ============================================

export const mockPrimaryMetrics: MetricResult[] = [
  {
    metricName: 'CTR (点击率)',
    metricType: 'ctr',
    control: {
      mean: 0.032,
      stdDev: 0.008,
      sampleSize: 125000,
      total: 4000,
      confidenceInterval: [0.031, 0.033],
    },
    treatment: {
      mean: 0.0365,
      stdDev: 0.008,
      sampleSize: 128000,
      total: 4672,
      confidenceInterval: [0.0355, 0.0375],
    },
    lift: 14.06,
    liftLowerCI: 9.5,
    liftUpperCI: 18.5,
    absoluteDiff: 0.0045,
    pValue: 0.0001,
    confidenceLevel: 0.95,
    isSignificant: true,
    isPositive: true,
    testMethod: 'z-test',
    mde: 0.005,
  },
];

export const mockGuardrailMetrics = [
  {
    metricName: '页面加载时间',
    passed: true,
    controlValue: 1.2,
    treatmentValue: 1.25,
    deviation: 4.2,
    threshold: 10,
    message: '加载时间变化在可接受范围内',
  },
  {
    metricName: '跳出率',
    passed: true,
    controlValue: 0.35,
    treatmentValue: 0.34,
    deviation: -2.9,
    threshold: 5,
    message: '跳出率未显著上升',
  },
];

// ============================================
// Mock Traffic Alerts
// ============================================

export const mockTrafficAlerts: TrafficAlert[] = [
  {
    id: 'alert-srm-1',
    type: 'srm_detected',
    severity: 'critical',
    title: '样本比例严重不匹配 (SRM)',
    description: '搜索排序算法优化实验检测到 SRM，control:treatment = 45:55',
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
    experimentId: '2',
  },
  {
    id: 'alert-delay-1',
    type: 'data_delay',
    severity: 'warning',
    title: '数据延迟 15 分钟',
    description: '部分实验数据存在延迟，请关注实时指标准确性',
    detectedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

// ============================================
// Mock Report Jobs
// ============================================

export const mockReportJobs: ReportJob[] = [
  {
    id: 'job-1',
    type: 'daily_summary',
    status: 'completed',
    experimentId: '1',
    experimentName: '首页 CTA 按钮优化实验',
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() - 3600000).toISOString(),
    duration: 3600,
    message: 'T+1 日报生成完成',
  },
  {
    id: 'job-2',
    type: 'report_generation',
    status: 'running',
    experimentId: '3',
    experimentName: ' checkout 流程优化',
    startTime: new Date(Date.now() - 1800000).toISOString(),
    progress: 65,
    message: '正在计算统计显著性...',
  },
  {
    id: 'job-3',
    type: 'report_generation',
    status: 'failed',
    experimentId: '4',
    experimentName: '推荐算法 v2 升级',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 82800000).toISOString(),
    duration: 3600,
    errorMessage: '数据源连接超时，请检查 ClickHouse 连接配置',
  },
  {
    id: 'job-4',
    type: 'realtime',
    status: 'running',
    startTime: new Date(Date.now() - 60000).toISOString(),
    progress: 100,
    message: '实时聚合任务执行中',
  },
  {
    id: 'job-5',
    type: 'daily_summary',
    status: 'pending',
    experimentId: '2',
    experimentName: '搜索排序算法优化',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    message: '等待执行',
  },
];

// ============================================
// Mock Experiment Reports
// ============================================

export const mockExperimentReports: ExperimentReport[] = [
  {
    id: 'report-1',
    experimentId: '3',
    experimentName: ' checkout 流程优化',
    status: 'completed',
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    generatedBy: 'system',
    timeRange: {
      start: '2023-12-01',
      end: '2024-01-05',
      days: 35,
    },
    srmCheck: mockSRMCheckPassed,
    primaryMetrics: mockPrimaryMetrics,
    secondaryMetrics: [
      {
        metricName: '人均订单数',
        metricType: 'custom',
        control: {
          mean: 1.5,
          stdDev: 0.5,
          sampleSize: 450000,
          total: 675000,
          confidenceInterval: [1.48, 1.52],
        },
        treatment: {
          mean: 1.65,
          stdDev: 0.5,
          sampleSize: 440000,
          total: 726000,
          confidenceInterval: [1.63, 1.67],
        },
        lift: 10.0,
        liftLowerCI: 8.0,
        liftUpperCI: 12.0,
        absoluteDiff: 0.15,
        pValue: 0.0001,
        confidenceLevel: 0.95,
        isSignificant: true,
        isPositive: true,
        testMethod: 't-test',
      },
    ],
    guardrailMetrics: mockGuardrailMetrics,
    recommendation: {
      action: 'launch',
      confidence: 0.92,
      reasoning: '实验组在核心指标上有统计显著的正向提升，Guardrail 指标均通过，结论可信度高。',
      estimatedImpact: {
        dailyRevenue: 28500,
        annualRevenue: 10400000,
      },
      nextSteps: [
        '与产品和运营团队确认全量上线计划',
        '制定灰度发布策略',
        '监控上线后的核心指标变化',
      ],
    },
    dailyTrend: [],
  },
];

// ============================================
// Mock Realtime Metrics
// ============================================

export const mockRealtimeMetrics: RealtimeMetrics = {
  experimentId: '1',
  experimentName: '首页 CTA 按钮优化实验',
  timestamp: new Date().toISOString(),
  isDelayed: false,
  variants: [
    {
      variantKey: 'control',
      variantName: '对照组',
      sampleSize: 125000,
      uniqueUsers: 98000,
      totalEvents: 520000,
      conversions: 15600,
      conversionRate: 3.2,
      revenue: 156000,
      trend: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 3.2 + (Math.random() - 0.5) * 0.2,
        sampleSize: 125000,
      })),
    },
    {
      variantKey: 'treatment',
      variantName: '实验组',
      sampleSize: 128000,
      uniqueUsers: 102000,
      totalEvents: 545000,
      conversions: 18624,
      conversionRate: 3.65,
      revenue: 186240,
      trend: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 3.65 + (Math.random() - 0.5) * 0.2,
        sampleSize: 128000,
      })),
    },
  ],
  primaryMetricTrend: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    value: 14.0 + (Math.random() - 0.5) * 2,
  })),
};
