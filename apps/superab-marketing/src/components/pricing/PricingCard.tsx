import { Link } from 'react-router-dom';
import { cn } from '@gate-flow/shared';
import { Check, X } from 'lucide-react';
import type { PricingTier } from '../../data/pricing';

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-8 flex flex-col',
        tier.highlighted
          ? 'border-purple-500/30 bg-gradient-to-b from-[#1a1030] to-[#12121a] shadow-lg shadow-purple-500/10'
          : 'border-white/[0.06] bg-[#12121a]'
      )}
    >
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-xs font-bold text-white">
          最受欢迎
        </div>
      )}

      <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
      <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

      <div className="mb-8">
        <span className="text-4xl font-extrabold">{tier.price}</span>
        {tier.priceLabel && (
          <span className="text-slate-500 ml-1">{tier.priceLabel}</span>
        )}
      </div>

      <Link
        to="/pricing"
        className={cn(
          'inline-flex items-center justify-center w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 mb-8',
          tier.highlighted
            ? 'bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] text-white hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-px'
            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
        )}
      >
        {tier.cta}
      </Link>

      <ul className="space-y-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-3 text-sm">
            {feature.included ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
