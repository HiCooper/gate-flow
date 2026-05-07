import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@gate-flow/shared';
import type { pricingFAQ } from '../../data/pricing';

interface PricingFAQProps {
  items: { q: string; a: string }[];
}

export function PricingFAQ({ items }: PricingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-[720px] mx-auto divide-y divide-white/[0.06]">
      {items.map((item, i) => (
        <div key={i} className="py-5">
          <button
            className="w-full flex items-center justify-between gap-4 text-left hover:text-purple-400 transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-medium text-base">{item.q}</span>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200',
                openIndex === i && 'rotate-180'
              )}
            />
          </button>
          {openIndex === i && (
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
