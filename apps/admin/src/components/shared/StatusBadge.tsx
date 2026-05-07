import { cn } from '@gate-flow/shared';
import type { PaywallStatus } from '../../mocks/paywalls';

interface StatusBadgeProps {
  status: PaywallStatus;
}

const config: Record<PaywallStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  active: { label: '已上线', className: 'bg-emerald-400/8 text-emerald-400 border-emerald-400/15' },
  paused: { label: '已暂停', className: 'bg-amber-400/8 text-amber-400 border-amber-400/15' },
  archived: { label: '已归档', className: 'bg-red-400/8 text-red-400 border-red-400/15' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
