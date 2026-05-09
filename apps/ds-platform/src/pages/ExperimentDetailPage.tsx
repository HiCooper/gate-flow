import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getExperiment, getExperimentVariants } from '../api/experiment';
import { getRealtimeMetrics, getEventDetails } from '../api/metrics';
import type { Experiment, SRMCheckResult, GuardrailCheck, TrafficDiagnosis, TrafficAlert, VariantRealtimeMetrics } from '../types';
import type { EventDetail } from '../api/metrics';

export function ExperimentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<VariantRealtimeMetrics[]>([]);
  const [srmCheck, setSRMCheck] = useState<SRMCheckResult | null>(null);
  const [guardrailMetrics, setGuardrailMetrics] = useState<GuardrailCheck[]>([]);
  const [trafficDiagnosis, setTrafficDiagnosis] = useState<TrafficDiagnosis | null>(null);
  const [trafficAlerts, setTrafficAlerts] = useState<TrafficAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'realtime' | 'diagnosis' | 'metrics' | 'traffic' | 'events'>('overview');
  const [showDiff, setShowDiff] = useState(false);
  const [normalized, setNormalized] = useState(false);
  const [trafficDays, setTrafficDays] = useState(7);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetail[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch experiment detail and variants
    Promise.all([
      getExperiment(id),
      getExperimentVariants(id),
    ])
      .then(([exp, variants]) => {
        setExperiment({ ...exp, variants });

        const controlVariant = variants.find(v => v.variantKey === 'control');
        const treatmentVariants = variants.filter(v => v.variantKey !== 'control');
        setSelectedControl(controlVariant?.id || null);
        setSelectedTreatments(treatmentVariants.map(v => v.id));

        // Fetch realtime metrics
        return getRealtimeMetrics({ expId: id, timeWindow: 1440 });
      })
      .then((metrics) => {
        if (metrics && 'variants' in metrics) {
          // API returns { variants: [...] } format
          setRealtimeMetrics(metrics.variants || []);
        } else if (Array.isArray(metrics)) {
          // API returns array of per-variant metrics
          const variantMetrics: VariantRealtimeMetrics[] = metrics.map((m: any) => ({
            variantKey: m.variant,
            variantName: m.variant,
            sampleSize: m.uniqueUsers,
            uniqueUsers: m.uniqueUsers,
            totalEvents: m.totalEvents,
            conversions: m.conversions,
            conversionRate: m.conversionRate,
            revenue: m.totalRevenue,
            trend: [],
          }));
          setRealtimeMetrics(variantMetrics);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch experiment:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Auto-fetch events when switching to events tab
  useEffect(() => {
    if (activeTab === 'events' && eventDetails.length === 0 && !loadingEvents && id) {
      setLoadingEvents(true);
      getEventDetails({ expId: id, limit: 100 })
        .then(setEventDetails)
        .catch(console.error)
        .finally(() => setLoadingEvents(false));
    }
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">实验不存在</p>
        <Link to="/" className="text-primary-600 hover:underline mt-2 inline-block">
          返回实验列表
        </Link>
      </div>
    );
  }

  // 计算指标数据
  const getVariantMetrics = (variantId: string) => {
    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant?.metrics) return { exposurePv: 0, exposureUv: 0, clickPv: 0, clickUv: 0, ctr: 0 };
    
    const metrics = variant.metrics;
    let factor = 1;
    const controlVariant = experiment.variants.find(v => v.id === selectedControl);
    
    if (normalized && controlVariant && variantId !== selectedControl) {
      const controlTraffic = controlVariant.trafficPercent || 50;
      const treatmentTraffic = variant.trafficPercent || 50;
      factor = controlTraffic / treatmentTraffic;
    }
    
    const exposurePv = Math.round(metrics.exposurePv * factor);
    const exposureUv = Math.round(metrics.exposureUv * factor);
    const clickPv = Math.round(metrics.clickPv * factor);
    const clickUv = Math.round(metrics.clickUv * factor);
    
    return {
      exposurePv,
      exposureUv,
      clickPv,
      clickUv,
      ctr: metrics.exposurePv > 0 ? (clickPv / exposurePv * 100) : 0,
    };
  };

  // 计算差值
  const getDiffValue = (variantId: string) => {
    const controlVariant = experiment.variants.find(v => v.id === selectedControl);
    const variant = experiment.variants.find(v => v.id === variantId);
    
    if (!variant?.metrics || !controlVariant?.metrics) return null;
    
    const controlMetrics = controlVariant.metrics;
    const treatmentMetrics = variant.metrics;
    
    const controlTraffic = controlVariant.trafficPercent || 50;
    const treatmentTraffic = variant.trafficPercent || 50;
    const factor = controlTraffic / treatmentTraffic;
    
    const normalizedPvDiff = Math.round(treatmentMetrics.exposurePv * factor) - controlMetrics.exposurePv;
    const normalizedUvDiff = Math.round(treatmentMetrics.exposureUv * factor) - controlMetrics.exposureUv;
    const normalizedClickPvDiff = Math.round(treatmentMetrics.clickPv * factor) - controlMetrics.clickPv;
    const normalizedClickUvDiff = Math.round(treatmentMetrics.clickUv * factor) - controlMetrics.clickUv;
    
    const treatmentCtr = treatmentMetrics.exposurePv > 0 
      ? (treatmentMetrics.clickPv * factor) / (treatmentMetrics.exposurePv * factor) * 100 : 0;
    const controlCtr = controlMetrics.exposurePv > 0 
      ? controlMetrics.clickPv / controlMetrics.exposurePv * 100 : 0;
    const ctrDiff = treatmentCtr - controlCtr;
    
    return { normalizedPvDiff, normalizedUvDiff, normalizedClickPvDiff, normalizedClickUvDiff, ctrDiff };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {experiment.name}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              experiment.status === 'running' ? 'bg-green-100 text-green-700' :
              experiment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {experiment.status === 'running' ? '运行中' :
               experiment.status === 'completed' ? '已完成' :
               experiment.status === 'paused' ? '已暂停' : '草稿'}
            </span>
            {srmCheck?.hasSRM && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                SRM 异常
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {experiment.description}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: '概览', icon: BarChart3 },
            { id: 'realtime', label: '实时监控', icon: Activity },
            { id: 'traffic', label: '流量走势', icon: Calendar },
            { id: 'diagnosis', label: '分流诊断', icon: Users },
            { id: 'metrics', label: '指标分析', icon: TrendingUp },
            { id: 'events', label: '事件明细', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'diagnosis' && (srmCheck?.hasSRM || trafficAlerts.length > 0) && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variant Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              流量分配
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experiment.variants.map((variant) => {
                const lift = variant.isControl ? 0 : 
                  (experiment.variants[0]?.metrics?.conversionRate ? 
                    ((variant.metrics?.conversionRate || 0) - experiment.variants[0].metrics.conversionRate) / experiment.variants[0].metrics.conversionRate * 100 : 0);
                
                return (
                  <div key={variant.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${variant.isControl ? 'bg-slate-400' : 'bg-primary-500'}`} />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {variant.name}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {variant.trafficPercent}%
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">曝光 PV</span>
                        <span className="font-mono">{variant.metrics?.exposurePv?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CTR</span>
                        <span className="font-mono">
                          {variant.metrics?.exposurePv && variant.metrics.exposurePv > 0
                            ? ((variant.metrics.clickPv / variant.metrics.exposurePv) * 100).toFixed(2)
                            : 0}%
                        </span>
                      </div>
                      {!variant.isControl && (
                        <div className="flex justify-between pt-2 border-t border-slate-100">
                          <span className="text-slate-500">相对提升</span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            lift > 0 ? 'text-emerald-600' : lift < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {lift > 0 ? <TrendingUp className="w-4 h-4" /> : lift < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                            {lift > 0 ? '+' : ''}{lift.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guardrail Metrics */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Guardrail 指标
            </h2>
            <div className="space-y-3">
              {guardrailMetrics.map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {metric.metricName}
                    </span>
                    {metric.passed ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        通过
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        异常
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {metric.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'realtime' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {realtimeMetrics.length === 0 ? (
              <div className="col-span-4 text-center py-8 text-slate-500">
                暂无实时数据
              </div>
            ) : (
              realtimeMetrics.map((variant) => (
                <div key={variant.variantKey} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <div className="text-sm text-slate-500 mb-1">{variant.variantName}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {variant.sampleSize.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">样本量</div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                    <div>事件数: {variant.totalEvents}</div>
                    <div>转化数: {variant.conversions}</div>
                    <div>转化率: {(variant.conversionRate * 100).toFixed(2)}%</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Trend Chart - only show if we have trend data */}
          {realtimeMetrics.some(v => v.trend.length > 0) ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                实时趋势
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, '转化率']} />
                    {realtimeMetrics.map((variant) => (
                      <Line
                        key={variant.variantKey}
                        type="monotone"
                        data={variant.trend.map((p) => ({
                          time: format(new Date(p.timestamp), 'HH:mm'),
                          value: p.value,
                        }))}
                        dataKey="value"
                        stroke={variant.variantKey === 'control' ? '#64748b' : '#6366f1'}
                        strokeWidth={2}
                        dot={false}
                        name={variant.variantName}
                      />
                    ))}
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-slate-500 py-4">
                暂无趋势数据。趋势数据需要事件携带时间戳并在多个时间点有数据。
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg border ${
            trafficDiagnosis?.overallHealth === 'healthy' ? 'bg-green-50 border-green-200' :
            trafficDiagnosis?.overallHealth === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-4">
              {trafficDiagnosis?.overallHealth === 'healthy' ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-red-600" />
              )}
              <div>
                <h2 className={`text-xl font-bold ${
                  trafficDiagnosis?.overallHealth === 'healthy' ? 'text-green-700' :
                  trafficDiagnosis?.overallHealth === 'warning' ? 'text-amber-700' :
                  'text-red-700'
                }`}>
                  流量健康状态: {
                    trafficDiagnosis?.overallHealth === 'healthy' ? '健康' :
                    trafficDiagnosis?.overallHealth === 'warning' ? '警告' : '异常'
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                SRM 检验
              </h3>
              {srmCheck && (
                <div className={`p-4 rounded-lg mb-4 ${
                  srmCheck.hasSRM ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {srmCheck.hasSRM ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <span className={`font-medium ${
                      srmCheck.hasSRM ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {srmCheck.hasSRM ? '检测到 SRM' : 'SRM 检验通过'}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-slate-500">期望比例</div>
                  <div className="font-mono font-medium">{srmCheck?.expectedRatio}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-slate-500">实际比例</div>
                  <div className={`font-mono font-medium ${srmCheck?.hasSRM ? 'text-red-600' : ''}`}>
                    {srmCheck?.actualRatio}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-slate-500">p-value</div>
                  <div className={`font-mono font-medium ${(srmCheck?.pValue || 1) < 0.05 ? 'text-red-600' : ''}`}>
                    {srmCheck?.pValue?.toFixed(6)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-slate-500">卡方统计量</div>
                  <div className="font-mono font-medium">{srmCheck?.chiSquareStat?.toFixed(4)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                告警列表
              </h3>
              {trafficAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>暂无告警</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trafficAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {alert.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                流量趋势
              </h3>
              <div className="flex gap-2">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTrafficDays(days)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      trafficDays === days
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    近 {days} 天
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              曝光 PV 趋势
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), '曝光 PV']} />
                  {experiment.variants.map((v, idx) => {
                    const expPv = v.metrics?.exposurePv || 0;
                    return (
                      <Line
                        key={v.id}
                        type="monotone"
                        data={Array.from({ length: trafficDays }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (trafficDays - 1 - i));
                          const basePv = expPv / trafficDays;
                          const variance = (Math.random() - 0.5) * 0.2 * basePv;
                          return { date: format(date, 'MM-dd'), value: Math.round(basePv + variance) };
                        })}
                        dataKey="value"
                        stroke={v.isControl ? '#64748b' : `hsl(${220 + idx * 30}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                        name={v.name}
                      />
                    );
                  })}
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              各组流量汇总
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-600">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">组别</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">流量占比</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">累计曝光 PV</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">平均 CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {experiment.variants.map((v) => {
                    const expPv = v.metrics?.exposurePv || 0;
                    const clickPv = v.metrics?.clickPv || 0;
                    const ctr = expPv > 0 ? (clickPv / expPv * 100) : 0;
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">{v.name}</td>
                        <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{v.trafficPercent}%</td>
                        <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{expPv.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{ctr.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Group Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              选择对比组
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  对照组 (单选)
                </label>
                <div className="space-y-2">
                  {experiment.variants.filter(v => v.variantKey === 'control').map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedControl === v.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="control-group"
                        checked={selectedControl === v.id}
                        onChange={() => setSelectedControl(v.id)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">{v.name}</div>
                        <div className="text-xs text-slate-500">{v.trafficPercent}% 流量</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  实验组 (多选)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {experiment.variants.filter(v => v.variantKey !== 'control').map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTreatments.includes(v.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTreatments.includes(v.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTreatments([...selectedTreatments, v.id]);
                          } else {
                            setSelectedTreatments(selectedTreatments.filter(id => id !== v.id));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">{v.name}</div>
                        <div className="text-xs text-slate-500">{v.trafficPercent}% 流量</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Table */}
          {selectedControl && selectedTreatments.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      showDiff ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4 inline mr-1" />
                    对比对照组
                  </button>
                  <button
                    onClick={() => setNormalized(!normalized)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      normalized ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    归一化
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-600">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">组别</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">曝光 PV</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">曝光 UV</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">点击 PV</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">点击 UV</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {experiment.variants.find(v => v.id === selectedControl)?.name}
                      </td>
                      {(() => {
                        const m = getVariantMetrics(selectedControl);
                        return (
                          <>
                            <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{m.exposurePv.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{m.exposureUv.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{m.clickPv.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{m.clickUv.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">{m.ctr.toFixed(2)}%</td>
                          </>
                        );
                      })()}
                    </tr>
                    {selectedTreatments.map((tid) => {
                      const variant = experiment.variants.find(v => v.id === tid);
                      const m = getVariantMetrics(tid);
                      const diff = getDiffValue(tid);
                      return (
                        <tr key={tid} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
                            {variant?.name}
                          </td>
                          <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">
                            {m.exposurePv.toLocaleString()}
                            {showDiff && diff && (
                              <div className={`text-xs ${diff.normalizedPvDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff.normalizedPvDiff >= 0 ? '+' : ''}{diff.normalizedPvDiff.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">
                            {m.exposureUv.toLocaleString()}
                            {showDiff && diff && (
                              <div className={`text-xs ${diff.normalizedUvDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff.normalizedUvDiff >= 0 ? '+' : ''}{diff.normalizedUvDiff.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">
                            {m.clickPv.toLocaleString()}
                            {showDiff && diff && (
                              <div className={`text-xs ${diff.normalizedClickPvDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff.normalizedClickPvDiff >= 0 ? '+' : ''}{diff.normalizedClickPvDiff.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">
                            {m.clickUv.toLocaleString()}
                            {showDiff && diff && (
                              <div className={`text-xs ${diff.normalizedClickUvDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff.normalizedClickUvDiff >= 0 ? '+' : ''}{diff.normalizedClickUvDiff.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono border border-slate-200 dark:border-slate-600">
                            {m.ctr.toFixed(2)}%
                            {showDiff && diff && (
                              <div className={`text-xs ${diff.ctrDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff.ctrDiff >= 0 ? '+' : ''}{diff.ctrDiff.toFixed(2)}%
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Statistical Info */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="text-sm text-slate-500">p-value</div>
                    <div className="font-mono font-bold text-lg">-</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="text-sm text-slate-500">置信度</div>
                    <div className="font-bold text-lg">-</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="text-sm text-slate-500">置信区间</div>
                    <div className="font-mono text-sm">-</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="text-sm text-slate-500">检验方法</div>
                    <div className="font-medium">-</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-slate-400 mb-2">⚠️</div>
              <p className="text-slate-500">请先选择对照组和至少一个实验组</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              事件明细
            </h2>
            <button
              onClick={() => {
                if (!id) return;
                setLoadingEvents(true);
                getEventDetails({ expId: id, limit: 100 })
                  .then(setEventDetails)
                  .catch(console.error)
                  .finally(() => setLoadingEvents(false));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingEvents ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>

          {loadingEvents ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : eventDetails.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-slate-400 mb-2">暂无事件数据</div>
              <p className="text-sm text-slate-500">点击刷新按钮加载事件数据</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">时间</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">事件类型</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">用户ID</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">平台</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">变体</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">属性</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventDetails.map((event, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {event.timestamp}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            event.eventType === 'exposure' ? 'bg-blue-100 text-blue-700' :
                            event.eventType === 'click' ? 'bg-green-100 text-green-700' :
                            event.eventType === 'conversion' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {event.eventType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {event.userId}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {event.platform || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {event.variant?.[0] && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              event.variant[0] === 'control' ? 'bg-slate-200 text-slate-600' : 'bg-primary-100 text-primary-700'
                            }`}>
                              {event.variant[0]}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                          {event.properties || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                共 {eventDetails.length} 条事件
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
