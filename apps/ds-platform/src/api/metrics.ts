import type { 
  RealtimeMetrics as RealtimeMetricsType,
  DailyMetrics, 
  DashboardStats,
  SRMCheckResult,
  TrafficDiagnosis,
  TrafficAlert,
  MetricResult,
  GuardrailCheck,
  TrendDataPoint,
} from '../types';

const API_BASE = '/api/v1/metrics';

export interface GetRealtimeMetricsParams {
  expId: string;
  timeWindow?: number;      // 分钟
  interval?: number;        // 聚合间隔（分钟）
}

/**
 * 获取实验实时指标
 */
export async function getRealtimeMetrics(
  params: GetRealtimeMetricsParams
): Promise<RealtimeMetricsType> {
  const searchParams = new URLSearchParams({ expId: params.expId });
  if (params.timeWindow) searchParams.set('window', String(params.timeWindow));
  if (params.interval) searchParams.set('interval', String(params.interval));

  const res = await fetch(`${API_BASE}/realtime?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch realtime metrics');
  return res.json();
}

/**
 * 获取实时指标趋势
 */
export async function getRealtimeTrend(
  expId: string,
  metricName: string,
  hours: number = 24
): Promise<TrendDataPoint[]> {
  const searchParams = new URLSearchParams({
    expId,
    metric: metricName,
    hours: String(hours),
  });

  const res = await fetch(`${API_BASE}/realtime/trend?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch realtime trend');
  return res.json();
}

/**
 * 获取每日指标
 */
export async function getDailyMetrics(
  expId: string,
  startDate?: string,
  endDate?: string
): Promise<DailyMetrics[]> {
  const searchParams = new URLSearchParams({ expId });
  if (startDate) searchParams.set('startDate', startDate);
  if (endDate) searchParams.set('endDate', endDate);

  const res = await fetch(`${API_BASE}/daily?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch daily metrics');
  return res.json();
}

/**
 * 获取仪表盘统计
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

/**
 * 获取实验完整指标
 */
export async function getExperimentMetrics(
  expId: string
): Promise<{ 
  realtime: RealtimeMetricsType; 
  daily: DailyMetrics[];
}> {
  const [realtime, daily] = await Promise.all([
    getRealtimeMetrics({ expId }),
    getDailyMetrics(expId),
  ]);
  return { realtime, daily };
}

// ============================================
// SRM (Sample Ratio Mismatch) APIs
// ============================================

export interface SRMCheckParams {
  expId: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 执行 SRM 检验
 */
export async function checkSRM(params: SRMCheckParams): Promise<SRMCheckResult> {
  const searchParams = new URLSearchParams({ expId: params.expId });
  if (params.startTime) searchParams.set('startTime', params.startTime);
  if (params.endTime) searchParams.set('endTime', params.endTime);

  const res = await fetch(`${API_BASE}/srm/check?${searchParams}`);
  if (!res.ok) throw new Error('Failed to check SRM');
  return res.json();
}

/**
 * 获取实验 SRM 历史
 */
export async function getSRMHistory(
  expId: string,
  days: number = 7
): Promise<SRMCheckResult[]> {
  const searchParams = new URLSearchParams({
    expId,
    days: String(days),
  });

  const res = await fetch(`${API_BASE}/srm/history?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch SRM history');
  return res.json();
}

/**
 * 获取 SRM 告警列表
 */
export async function getSRMAlerts(): Promise<{
  alerts: TrafficAlert[];
  total: number;
}> {
  const res = await fetch(`${API_BASE}/srm/alerts`);
  if (!res.ok) throw new Error('Failed to fetch SRM alerts');
  return res.json();
}

// ============================================
// Traffic Diagnosis APIs
// ============================================

/**
 * 获取分流诊断结果
 */
export async function getTrafficDiagnosis(
  expId: string
): Promise<TrafficDiagnosis> {
  const res = await fetch(`${API_BASE}/traffic/diagnosis/${expId}`);
  if (!res.ok) throw new Error('Failed to fetch traffic diagnosis');
  return res.json();
}

/**
 * 获取分流趋势数据
 */
export async function getTrafficTrend(
  expId: string,
  hours: number = 24
): Promise<{
  variantKey: string;
  variantName: string;
  data: TrendDataPoint[];
}[]> {
  const searchParams = new URLSearchParams({
    expId,
    hours: String(hours),
  });

  const res = await fetch(`${API_BASE}/traffic/trend?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch traffic trend');
  return res.json();
}

/**
 * 获取流量异常告警
 */
export async function getTrafficAlerts(
  params?: { severity?: string; resolved?: boolean }
): Promise<TrafficAlert[]> {
  const searchParams = new URLSearchParams();
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.resolved !== undefined) searchParams.set('resolved', String(params.resolved));

  const res = await fetch(`${API_BASE}/traffic/alerts?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch traffic alerts');
  return res.json();
}

// ============================================
// Metric Analysis APIs
// ============================================

/**
 * 获取实验统计结果
 */
export async function getExperimentStats(
  expId: string
): Promise<{
  primaryMetrics: MetricResult[];
  secondaryMetrics: MetricResult[];
  guardrailMetrics: GuardrailCheck[];
}> {
  const res = await fetch(`${API_BASE}/stats/${expId}`);
  if (!res.ok) throw new Error('Failed to fetch experiment stats');
  return res.json();
}

/**
 * 获取指标趋势
 */
export async function getMetricTrend(
  expId: string,
  metricName: string,
  days: number = 14
): Promise<{
  metricName: string;
  control: TrendDataPoint[];
  treatment: TrendDataPoint[];
}[]> {
  const searchParams = new URLSearchParams({
    expId,
    metric: metricName,
    days: String(days),
  });

  const res = await fetch(`${API_BASE}/stats/trend?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch metric trend');
  return res.json();
}

/**
 * 获取 Guardrail 检查结果
 */
export async function getGuardrailCheck(
  expId: string
): Promise<GuardrailCheck[]> {
  const res = await fetch(`${API_BASE}/guardrail/${expId}`);
  if (!res.ok) throw new Error('Failed to fetch guardrail check');
  return res.json();
}

// ============================================
// Dimension Analysis APIs
// ============================================

/**
 * 获取多维度拆分数据
 */
export async function getDimensionAnalysis(
  expId: string,
  dimension: 'platform' | 'region' | 'user_type' | 'device'
): Promise<MetricResult[]> {
  const searchParams = new URLSearchParams({ expId, dimension });

  const res = await fetch(`${API_BASE}/dimensions?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch dimension analysis');
  return res.json();
}

// ============================================
// Data Availability APIs
// ============================================

/**
 * 检查数据可用性
 */
export async function checkDataAvailability(
  expId: string,
  date: string
): Promise<{
  hasData: boolean;
  eventCount: number;
  userCount: number;
  lastEventTime?: string;
  issues: string[];
}> {
  const searchParams = new URLSearchParams({ expId, date });

  const res = await fetch(`${API_BASE}/data/availability?${searchParams}`);
  if (!res.ok) throw new Error('Failed to check data availability');
  return res.json();
}

/**
 * 获取数据延迟状态
 */
export async function getDataDelayStatus(): Promise<{
  isDelayed: boolean;
  delayMinutes: number;
  affectedExperiments: string[];
}> {
  const res = await fetch(`${API_BASE}/data/delay-status`);
  if (!res.ok) throw new Error('Failed to fetch data delay status');
  return res.json();
}

// ============================================
// Event Details API
// ============================================

export interface EventDetail {
  eventId: string;
  eventType: string;
  userId: string;
  timestamp: string;
  platform: string;
  deviceId: string;
  sessionId: string;
  variant: string[];
  layer: string[];
  properties: string;
}

export interface GetEventDetailsParams {
  expId: string;
  limit?: number;
  offset?: number;
}

/**
 * 获取事件明细
 */
export async function getEventDetails(
  params: GetEventDetailsParams
): Promise<EventDetail[]> {
  const searchParams = new URLSearchParams({ expId: params.expId });
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/events?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch event details');
  return res.json();
}
