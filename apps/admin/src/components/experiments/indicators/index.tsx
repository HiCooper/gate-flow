import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import type { StatisticalResult } from '../types';

export function SignificanceBadge({ stat }: { stat: StatisticalResult }) {
  if (!stat.isSignificant) {
    if (stat.ciLower <= 0 && stat.ciUpper >= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 text-sm font-medium">
          <Minus className="w-4 h-4" />
          不显著
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/8 text-amber-400 border border-amber-400/15 text-sm font-medium">
        <AlertTriangle className="w-4 h-4" />
        需更多数据
      </span>
    );
  }

  if (stat.liftDirection === 'positive') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/8 text-emerald-400 border border-emerald-400/15 text-sm font-medium">
        <TrendingUp className="w-4 h-4" />
        显著提升
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/8 text-red-400 border border-red-400/15 text-sm font-medium">
      <TrendingDown className="w-4 h-4" />
      显著下降
    </span>
  );
}

export function LiftIndicator({ stat }: { stat: StatisticalResult }) {
  const color = stat.liftDirection === 'positive' ? 'text-emerald-400' : stat.liftDirection === 'negative' ? 'text-red-400' : 'text-slate-400';
  const Icon = stat.liftDirection === 'positive' ? TrendingUp : stat.liftDirection === 'negative' ? TrendingDown : Minus;

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="w-5 h-5" />
      <span className="text-2xl font-extrabold">
        {stat.lift > 0 ? '+' : ''}{stat.lift.toFixed(1)}%
      </span>
    </div>
  );
}

export function ConfidenceIntervalBar({ stat }: { stat: StatisticalResult }) {
  const range = stat.ciUpper - stat.ciLower;
  const center = stat.lift;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-text-muted">
        <span>{stat.ciLower.toFixed(1)}%</span>
        <span>95% CI</span>
        <span>{stat.ciUpper.toFixed(1)}%</span>
      </div>
      <div className="relative h-3 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={`absolute h-full rounded-full ${
            stat.ciLower > 0 ? 'bg-emerald-400/30' : stat.ciUpper < 0 ? 'bg-red-400/30' : 'bg-slate-400/30'
          }`}
          style={{
            left: `${Math.max(0, Math.min(100, ((-range / 2) / range) * 100))}%`,
            width: '100%',
          }}
        />
        <div
          className={`absolute w-3 h-3 rounded-full border-2 ${
            stat.lift > 0 ? 'bg-emerald-400 border-emerald-400' : stat.lift < 0 ? 'bg-red-400 border-red-400' : 'bg-slate-400 border-slate-400'
          }`}
          style={{
            left: `${Math.max(0, Math.min(100 - 12, 50 + (center / range) * 50))}%`,
            top: '0',
          }}
        />
      </div>
    </div>
  );
}
