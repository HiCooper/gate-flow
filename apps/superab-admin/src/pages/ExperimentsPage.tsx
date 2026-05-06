import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperimentStore } from '../stores/experimentStore';
import { CreateExperimentModal } from '../components/experiments';
import { Plus, Search, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { ExperimentStatus } from '../components/experiments/types';
import { statusLabel, metricLabel } from '../components/experiments/types';

const statusColor: Record<ExperimentStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  review: 'bg-purple-400/8 text-purple-400 border-purple-400/15',
  ramp: 'bg-blue-400/8 text-blue-400 border-blue-400/15',
  running: 'bg-emerald-400/8 text-emerald-400 border-emerald-400/15',
  paused: 'bg-amber-400/8 text-amber-400 border-amber-400/15',
  analyzing: 'bg-indigo-400/8 text-indigo-400 border-indigo-400/15',
  decision: 'bg-orange-400/8 text-orange-400 border-orange-400/15',
  archive: 'bg-gray-400/8 text-gray-400 border-gray-400/15',
};

export function ExperimentsPage() {
  const { experiments, loading, fetchExperiments } = useExperimentStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  const filtered = experiments.filter((exp) => {
    if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
    if (search && !exp.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statuses: (ExperimentStatus | 'all')[] = ['all', 'draft', 'running', 'ramp', 'paused', 'review', 'analyzing', 'decision', 'archive'];

  // Calculate days running
  const getDaysRunning = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">实验</h1>
          <p className="text-sm text-text-muted">管理你的 A/B 实验和多变量测试。</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 hover:-translate-y-px transition-all"
        >
          <Plus className="w-4 h-4" />
          新建实验
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
          <input
            type="text"
            placeholder="搜索实验..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-3 border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-accent-400/8 text-accent-400 border border-accent-400/15'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'
              }`}
            >
              {s === 'all' ? '全部' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-sm text-text-muted">暂无实验数据</div>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建第一个实验
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((exp) => (
            <Link key={exp.id} to={`/experiments/${exp.id}`}>
              <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6 hover:border-accent-400/20 hover:bg-surface-3 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold mb-1">{exp.name}</h3>
                    <p className="text-xs text-text-muted">{exp.paywallName} &middot; {exp.variants.length > 0 ? exp.variants.length + ' 个变体' : '配置变体'}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor[exp.status]}`}>
                    {statusLabel[exp.status]}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                  <span>{exp.startDate.slice(0, 10)}</span>
                  <span>流量 {exp.trafficAllocation}%</span>
                  <span>指标: {metricLabel[exp.primaryMetric] || exp.primaryMetric}</span>
                </div>

                {/* Results preview */}
                {exp.status === 'running' && exp.results.totalImpressions > 0 && (
                  <div className="rounded-xl bg-surface-3 border border-border-subtle p-3 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <div className="text-xs text-text-secondary">
                      运行 {getDaysRunning(exp.startDate)} 天 &middot; {exp.results.totalImpressions.toLocaleString()} 展示
                    </div>
                  </div>
                )}

                {exp.status === 'completed' && exp.results.statistical && (
                  <div className={`rounded-xl p-3 flex items-center justify-between ${
                    exp.results.statistical.isSignificant
                      ? exp.results.statistical.liftDirection === 'positive'
                        ? 'bg-emerald-400/5 border border-emerald-400/10'
                        : 'bg-red-400/5 border border-red-400/10'
                      : 'bg-surface-3 border border-border-subtle'
                  }`}>
                    <div className="flex items-center gap-2">
                      {exp.results.statistical.liftDirection === 'positive' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : exp.results.statistical.liftDirection === 'negative' ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : null}
                      <span className={`text-sm font-bold ${
                        exp.results.statistical.isSignificant
                          ? exp.results.statistical.liftDirection === 'positive' ? 'text-emerald-400' : 'text-red-400'
                          : 'text-text-primary'
                      }`}>
                        {exp.results.statistical.lift > 0 ? '+' : ''}{exp.results.statistical.lift.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      置信度 {exp.results.confidence}%
                    </div>
                  </div>
                )}

                {exp.status === 'paused' && exp.results.winner && (
                  <div className="rounded-xl bg-amber-400/5 border border-amber-400/10 p-3">
                    <div className="text-xs text-amber-400 font-medium">
                      暂停中 &middot; 已识别获胜变体
                    </div>
                  </div>
                )}

                {exp.status === 'draft' && (
                  <div className="rounded-xl bg-surface-3 border border-border-subtle p-3">
                    <div className="text-xs text-text-muted">
                      草稿 &middot; 点击编辑并启动
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateExperimentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}