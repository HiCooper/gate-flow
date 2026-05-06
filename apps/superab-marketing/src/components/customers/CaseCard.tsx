import { Card } from '@gate-flow/shared';
import { Building2, TrendingUp } from 'lucide-react';
import type { CustomerCase } from '../../data/customers';

interface CaseCardProps {
  case_: CustomerCase;
}

export function CaseCard({ case_ }: CaseCardProps) {
  return (
    <Card padding="lg" className="h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <div className="font-bold text-sm">{case_.name}</div>
          <div className="text-xs text-slate-500">{case_.industry}</div>
        </div>
      </div>

      <blockquote className="text-sm text-slate-300 leading-relaxed mb-6 italic border-l-2 border-purple-500/30 pl-4">
        "{case_.quote}"
      </blockquote>

      <div className="flex items-center gap-1 text-xs text-slate-500 mb-6">
        <span className="font-medium text-slate-400">{case_.author}</span>
        <span>&middot;</span>
        <span>{case_.role}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
        {case_.stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-lg font-extrabold gradient-text mb-0.5">{stat.value}</div>
            <div className="text-[10px] text-slate-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
