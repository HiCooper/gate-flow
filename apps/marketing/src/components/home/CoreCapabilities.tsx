import { Card, Container, Badge } from '@gate-flow/shared';
import { LayoutGrid, BarChart3, Sparkles, Users, ShieldCheck, Activity } from 'lucide-react';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';
import { features } from '../../data/features';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  BarChart3,
  Sparkles,
  Users,
  ShieldCheck,
  Activity,
};

export function CoreCapabilities() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <Container className="text-center">
        <SectionLabel>核心能力</SectionLabel>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          一个平台，解决所有
          <br className="sm:hidden" />
          <GradientText>付费墙难题</GradientText>
        </h2>
        <p className="text-slate-400 max-w-[600px] mx-auto mb-16 text-lg">
          从设计到分析，从实验到优化，GateFlow 为你的变现链路提供完整解决方案。
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {features.map((feature) => {
            const Icon = iconMap[feature.iconName];
            return (
              <Card key={feature.title} hover padding="lg">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  {Icon && <Icon className="w-6 h-6 text-purple-400" />}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
