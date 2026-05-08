// ============================================
// Experiment Types
// ============================================

export interface Experiment {
  id: string;
  expKey: string;              // 业务标识
  name: string;
  description: string;
  status: ExperimentStatus;
  layerId: number;
  bucketStart: number;
  bucketEnd: number;
  startTime: string;
  endTime?: string;
  createdBy: string;
  tags: string[];
  variants: Variant[];
  primaryMetric: string;
  guardrailMetrics?: string[];
}

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

export interface Variant {
  id: string;
  variantKey: string;          // control, treatment, etc.
  name: string;
  description?: string;
  bucketStart: number;
  bucketEnd: number;
  isControl: boolean;
  trafficPercent: number;       // 流量占比 %
  params?: Record<string, unknown>;
  metrics?: VariantMetrics;
}

export interface VariantMetrics {
  // 曝光指标
  exposurePv: number;          // 曝光 PV
  exposureUv: number;          // 曝光 UV
  // 点击指标
  clickPv: number;             // 点击 PV
  clickUv: number;             // 点击 UV
  // 转化指标
  conversions: number;        // 转化数
  conversionRate: number;      // 转化率
  // 收入指标
  revenue: number;             // 收入
  avgRevenuePerUser: number;   // 人均收入
}

// ============================================
// SRM (Sample Ratio Mismatch) Types
// ============================================

export interface SRMCheckResult {
  passed: boolean;             // 是否通过
  hasSRM: boolean;             // 是否有 SRM 问题
  chiSquareStat: number;       // 卡方统计量
  pValue: number;              // p 值
  expectedRatio: string;       // 期望比例 (e.g., "50:50")
  actualRatio: string;         // 实际比例
  variantCounts: VariantCount[];
  severity: SRMSeverity;       // 严重程度
  possibleCauses: string[];    // 可能原因
  recommendation: string;      // 建议
}

export type SRMSeverity = 'none' | 'warning' | 'critical';

export interface VariantCount {
  variantKey: string;
  variantName: string;
  expectedCount: number;
  actualCount: number;
  deviation: number;           // 偏离百分比
}

// ============================================
// Traffic Diagnosis Types
// ============================================

export interface TrafficDiagnosis {
  experimentId: string;
  experimentName: string;
  overallHealth: TrafficHealth;
  srmCheck: SRMCheckResult;
  trafficTrend: TrafficDataPoint[];
  anomalyAlerts: TrafficAlert[];
  recommendations: TrafficRecommendation[];
}

export type TrafficHealth = 'healthy' | 'warning' | 'critical';

export interface TrafficDataPoint {
  timestamp: string;
  variantKey: string;
  sampleSize: number;
  ratio: number;              // 占总流量比例
}

export interface TrafficAlert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  detectedAt: string;
  experimentId?: string;
}

export type AlertType = 
  | 'srm_detected'
  | 'traffic_spike'
  | 'traffic_drop'
  | 'data_delay'
  | 'report_missing'
  | 'guardrail_violation';

export interface TrafficRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

// ============================================
// Metrics Types
// ============================================

export interface MetricResult {
  metricName: string;
  metricType: MetricType;
  control: MetricValue;
  treatment: MetricValue;
  lift: number;                // 相对提升
  liftLowerCI: number;         // 提升置信区间下限
  liftUpperCI: number;         // 提升置信区间上限
  absoluteDiff: number;        // 绝对差值
  pValue: number;
  confidenceLevel: number;      // 置信度 (e.g., 0.95)
  isSignificant: boolean;
  isPositive: boolean;
  testMethod: TestMethod;
  mde?: number;                // 最小可检测效应
}

export type MetricType = 
  | 'conversion_rate'
  | 'ctr'
  | 'revenue'
  | 'arpu'
  | 'retention'
  | 'custom';

export interface MetricValue {
  mean: number;
  stdDev: number;
  sampleSize: number;
  total: number;
  confidenceInterval: [number, number];
}

export type TestMethod = 'z-test' | 't-test' | 'mann-whitney' | 'chi-square' | 'bootstrap' | 'msprt';

export interface GuardrailCheck {
  metricName: string;
  passed: boolean;
  controlValue: number;
  treatmentValue: number;
  deviation: number;           // 偏离百分比
  threshold: number;            // 阈值
  message: string;
}

// ============================================
// Realtime Metrics Types
// ============================================

export interface RealtimeMetrics {
  experimentId: string;
  experimentName: string;
  timestamp: string;
  isDelayed: boolean;           // 数据是否延迟
  delayMinutes?: number;
  variants: VariantRealtimeMetrics[];
  primaryMetricTrend: TrendDataPoint[];
}

export interface VariantRealtimeMetrics {
  variantKey: string;
  variantName: string;
  sampleSize: number;
  uniqueUsers: number;
  totalEvents: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  trend: TrendDataPoint[];
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  sampleSize?: number;
}

// ============================================
// Report Types
// ============================================

export interface ExperimentReport {
  id: string;
  experimentId: string;
  experimentName: string;
  status: ReportStatus;
  generatedAt: string;
  generatedBy: string;
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
  srmCheck: SRMCheckResult;
  primaryMetrics: MetricResult[];
  secondaryMetrics: MetricResult[];
  guardrailMetrics: GuardrailCheck[];
  recommendation: Recommendation;
  dailyTrend: DailyMetrics[];
  dimensions?: DimensionBreakdown[];
}

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Recommendation {
  action: RecommendationAction;
  confidence: number;
  reasoning: string;
  estimatedImpact: {
    dailyRevenue: number;
    annualRevenue: number;
  };
  nextSteps: string[];
}

export type RecommendationAction = 'launch' | 'stop' | 'continue' | 'rollback' | 'iterate';

export interface DailyMetrics {
  date: string;
  experimentId: string;
  variantKey: string;
  sampleSize: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface DimensionBreakdown {
  dimensionName: string;
  dimensionValue: string;
  metrics: MetricResult[];
}

// ============================================
// Job / Task Types
// ============================================

export interface ReportJob {
  id: string;
  type: JobType;
  status: JobStatus;
  experimentId?: string;
  experimentName?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;           // 耗时（秒）
  message?: string;
  errorMessage?: string;
  progress?: number;           // 0-100
  reportId?: string;
  scheduledTime?: string;      // 定时任务计划时间
}

export type JobType = 'realtime' | 'daily_summary' | 'report_generation' | 'data_check';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface DataAvailabilityCheck {
  experimentId: string;
  date: string;
  hasData: boolean;
  eventCount: number;
  userCount: number;
  lastEventTime?: string;
  issues: string[];
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStats {
  totalExperiments: number;
  activeExperiments: number;
  completedThisWeek: number;
  significantPositive: number;
  significantNegative: number;
  pendingReports: number;
  srmAlerts: number;
  dataDelays: number;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  status: ExperimentStatus;
  startTime: string;
  primaryMetric: string;
  lift: number;
  pValue: number;
  isSignificant: boolean;
  isPositive?: boolean;
  hasSRM: boolean;
  guardrailPassed: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
