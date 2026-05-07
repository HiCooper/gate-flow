import { useNavigate } from 'react-router-dom';
import { Container, Button } from '@gate-flow/shared';
import { Play, ArrowRight } from 'lucide-react';
import { GradientText } from '../shared/GradientText';

const heroStats = [
  { value: '200+', label: '付费墙模板' },
  { value: '35%', label: '平均转化提升' },
  { value: '5 min', label: 'SDK 集成时间' },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#1a1030] to-[#0a0a0f]" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] top-1/5 left-1/2 -translate-x-1/2 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] bottom-1/4 left-1/4 animate-pulse [animation-delay:1s]" />

      <Container className="relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          AI 驱动的付费墙增长基础设施
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 max-w-[900px] mx-auto">
          用 AI 驱动你的
          <br />
          <GradientText>付费墙增长引擎</GradientText>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-[680px] mx-auto mb-10 leading-relaxed">
          GateFlow 是面向移动应用与 Web 产品的一站式付费墙基础设施。
          从设计、实验、订阅管理到实时分析，一次集成，全面覆盖。
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />} onClick={() => navigate('/pricing')}>
            免费开始
          </Button>
          <Button variant="outline" size="lg" leftIcon={<Play className="w-5 h-5" />}>
            观看演示
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-[600px] mx-auto mb-16">
          {heroStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Mockup */}
        <div className="relative max-w-[900px] mx-auto animate-fade-in-up [animation-delay:300ms]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-2xl shadow-purple-500/5 overflow-hidden">
            {/* Mock title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0f]/50">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs text-slate-600">GateFlow Dashboard</span>
            </div>
            {/* Mock content */}
            <div className="p-6 flex gap-6">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {['转化率', 'ARPU', '订阅数'].map((label) => (
                    <div key={label} className="rounded-xl bg-[#1a1a2e] border border-white/[0.04] p-4">
                      <div className="text-xs text-slate-500 mb-1">{label}</div>
                      <div className="h-4 w-16 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded" />
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-[#1a1a2e] border border-white/[0.04] p-4 h-40 flex items-end gap-2">
                  {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-purple-500/20 to-cyan-500/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="w-64 space-y-4">
                <div className="rounded-xl bg-[#1a1a2e] border border-white/[0.04] p-4">
                  <div className="text-xs text-slate-500 mb-2">实验状态</div>
                  <div className="space-y-2">
                    {['价格测试', '文案对比', '设计A/B'].map((name, i) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow behind mockup */}
          <div className="absolute -inset-4 -z-10 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent rounded-3xl blur-xl" />
        </div>
      </Container>
    </section>
  );
}
