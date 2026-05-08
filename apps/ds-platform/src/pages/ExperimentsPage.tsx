import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import {
  mockExperiments,
  mockExperimentSummaries,
  mockDashboardStats,
} from '../api/mockData';
import type { Experiment, ExperimentSummary, ExperimentStatus } from '../types';

const STATUS_CONFIG: Record<ExperimentStatus, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  draft: { icon: Clock, color: 'text-slate-600', bgColor: 'bg-slate-100', label: '草稿' },
  running: { icon: Activity, color: 'text-green-600', bgColor: 'bg-green-100', label: '运行中' },
  paused: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100', label: '已暂停' },
  completed: { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100', label: '已完成' },
  archived: { icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-100', label: '已归档' },
};

export function ExperimentsPage() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [summaries, setSummaries] = useState<ExperimentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');
  const [showSRMOnly, setShowSRMOnly] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setExperiments(mockExperiments);
      setSummaries(mockExperimentSummaries);
      setLoading(false);
    }, 300);
  }, []);

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch = exp.name.toLowerCase().includes(search.toLowerCase()) ||
      exp.expKey.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    const summary = summaries.find((s) => s.id === exp.id);
    const matchesSRM = !showSRMOnly || (summary?.hasSRM ?? false);
    return matchesSearch && matchesStatus && matchesSRM;
  });

  const stats = mockDashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            实验概览
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            查看和管理所有 A/B 实验
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="总实验数"
          value={stats.totalExperiments}
          icon={Activity}
          color="text-slate-600"
        />
        <StatCard
          label="运行中"
          value={stats.activeExperiments}
          icon={Activity}
          color="text-green-600"
        />
        <StatCard
          label="本周完成"
          value={stats.completedThisWeek}
          icon={CheckCircle}
          color="text-blue-600"
        />
        <StatCard
          label="正向显著"
          value={stats.significantPositive}
          icon={TrendingUp}
          color="text-emerald-600"
        />
        <StatCard
          label="负向显著"
          value={stats.significantNegative}
          icon={TrendingDown}
          color="text-red-600"
        />
        <StatCard
          label="SRM 告警"
          value={stats.srmAlerts}
          icon={AlertTriangle}
          color={stats.srmAlerts > 0 ? 'text-red-600' : 'text-slate-600'}
          alert={stats.srmAlerts > 0}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索实验名称或 ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | 'all')}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">全部状态</option>
          <option value="running">运行中</option>
          <option value="completed">已完成</option>
          <option value="paused">已暂停</option>
          <option value="draft">草稿</option>
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showSRMOnly}
            onChange={(e) => setShowSRMOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-slate-700 dark:text-slate-300">仅显示 SRM 异常</span>
        </label>
      </div>

      {/* Experiments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredExperiments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>没有找到符合条件的实验</p>
          </div>
        ) : (
          filteredExperiments.map((exp) => {
            const summary = summaries.find((s) => s.id === exp.id);
            const statusConfig = STATUS_CONFIG[exp.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={exp.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/experiments/${exp.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {exp.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      {summary?.hasSRM && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          SRM 异常
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      {exp.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {exp.expKey}
                        </span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        开始于 {format(new Date(exp.startTime), 'yyyy-MM-dd')}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        主指标: <span className="font-medium text-slate-700 dark:text-slate-300">{exp.primaryMetric}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {summary && exp.status === 'completed' && (
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${summary.isSignificant ? (summary.isPositive ? 'text-emerald-600' : 'text-red-600') : 'text-slate-600'}`}>
                          {summary.isPositive ? '+' : ''}{summary.lift.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">
                          {summary.isSignificant ? '统计显著' : '不显著'}
                        </div>
                      </div>
                    )}
                    {summary && exp.status === 'running' && (
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/experiments/${exp.id}`}
                          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          查看详情
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants Preview */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-6">
                    {exp.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${variant.isControl ? 'bg-slate-400' : 'bg-primary-500'}`} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {variant.name}:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {variant.metrics?.conversionRate?.toFixed(2) || '-'}%
                        </span>
                        <span className="text-xs text-slate-400">
                          ({variant.trafficPercent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  alert?: boolean;
}

function StatCard({ label, value, icon: Icon, color, alert }: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border ${alert ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
