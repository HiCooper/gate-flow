import { useEffect } from 'react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ConversionFunnel } from '../components/dashboard/ConversionFunnel';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { RealTimeEvents } from '../components/dashboard/RealTimeEvents';
import { TopPaywalls } from '../components/dashboard/TopPaywalls';
import { Layers, TrendingUp, DollarSign, FlaskConical } from 'lucide-react';

export function DashboardPage() {
  const { data, loading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">仪表盘</h1>
        <p className="text-sm text-text-muted">欢迎回来，这是你的变现数据概览。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="付费墙总数"
          value={data.stats.activePaywalls}
          delta={2}
          icon={<Layers className="w-5 h-5 text-accent-400" />}
        />
        <StatsCard
          title="转化率"
          value={data.stats.conversionRate}
          delta={data.stats.conversionDelta}
          format="percentage"
          icon={<TrendingUp className="w-5 h-5 text-accent-400" />}
        />
        <StatsCard
          title="月度经常性收入"
          value={data.stats.mrr}
          delta={data.stats.mrrDelta}
          format="currency"
          icon={<DollarSign className="w-5 h-5 text-accent-400" />}
        />
        <StatsCard
          title="活跃实验"
          value={data.stats.activeExperiments}
          delta={data.stats.experimentDelta}
          icon={<FlaskConical className="w-5 h-5 text-accent-400" />}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart data={data.revenueTimeSeries} />
        <div className="space-y-6">
          <ConversionFunnel data={data.funnel} />
          <TopPaywalls data={data.topPaywalls} />
        </div>
      </div>

      {/* Real-time Events */}
      <div className="max-w-lg">
        <RealTimeEvents events={data.recentEvents} />
      </div>
    </div>
  );
}
