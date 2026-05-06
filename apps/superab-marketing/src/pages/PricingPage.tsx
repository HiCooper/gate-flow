import { Container } from '@gate-flow/shared';
import { SectionLabel } from '../components/shared/SectionLabel';
import { GradientText } from '../components/shared/GradientText';
import { PricingCard } from '../components/pricing/PricingCard';
import { PricingFAQ } from '../components/pricing/PricingFAQ';
import { pricingTiers, pricingFAQ } from '../data/pricing';

export function PricingPage() {
  return (
    <div className="pt-24 pb-24 lg:pb-32">
      <Container className="text-center mb-16">
        <SectionLabel>定价方案</SectionLabel>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          选择适合你的
          <GradientText>增长方案</GradientText>
        </h1>
        <p className="text-slate-400 max-w-[600px] mx-auto text-lg">
          从免费开始，按需升级。所有方案均包含 14 天免费试用。
        </p>
      </Container>

      <Container>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
      </Container>

      <Container className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-12">
          常见问题
        </h2>
        <PricingFAQ items={pricingFAQ} />
      </Container>
    </div>
  );
}
