import { Zap, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@gate-flow/shared';
import type { RealTimeEvent } from '../../mocks/analytics';

interface RealTimeEventsProps {
  events: RealTimeEvent[];
}

const typeConfig = {
  conversion: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/8' },
  trial: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/8' },
  view: { icon: Eye, color: 'text-sky-400', bg: 'bg-sky-400/8' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/8' },
};

export function RealTimeEvents({ events }: RealTimeEventsProps) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">实时事件</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          实时
        </span>
      </div>
      <div className="space-y-2 max-h-[320px] overflow-y-auto">
        {events.map((event) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;
          return (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                <Icon className={cn('w-4 h-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{event.details}</span>
                  <span className="text-[10px] text-text-disabled shrink-0">{event.timestamp.slice(11, 19)}</span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {event.paywall} &middot; {event.user}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
