import { TrendingUp } from 'lucide-react';
import type { TopPaywall } from '../../mocks/analytics';

interface TopPaywallsProps {
  data: TopPaywall[];
}

export function TopPaywalls({ data }: TopPaywallsProps) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
      <h3 className="font-bold mb-4">付费墙收入排行</h3>
      <div className="space-y-1">
        {data.map((pw, i) => (
          <div
            key={pw.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
          >
            <span className="w-6 h-6 rounded-lg bg-accent-400/8 border border-accent-400/15 flex items-center justify-center text-xs font-bold text-accent-400 shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{pw.name}</div>
              <div className="text-xs text-text-muted">{pw.impressions.toLocaleString()} 展示</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold">¥{pw.revenue.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 flex items-center justify-end gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {pw.conversionRate}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
