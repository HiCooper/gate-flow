import { cn } from '@gate-flow/shared';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  delta?: number;
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
}

function formatValue(value: string | number, format: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'currency':
      return `¥${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    default:
      return value.toLocaleString();
  }
}

export function StatsCard({ title, value, delta, icon, format = 'number' }: StatsCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-text-muted">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-accent-400/8 border border-accent-400/15 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight">
        {formatValue(value, format)}
      </div>
      {delta !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-emerald-400' : 'text-red-400')}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? '+' : ''}{delta}% 较上月
        </div>
      )}
    </div>
  );
}
