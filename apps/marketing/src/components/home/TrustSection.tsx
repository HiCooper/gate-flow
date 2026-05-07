import { Container } from '@gate-flow/shared';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';

const trustStats = [
  { value: '10,000+', label: '开发者信赖' },
  { value: '99.99%', label: 'API 可用性' },
  { value: 'SOC 2', label: '安全认证' },
  { value: '50+', label: '国家和地区' },
];

const testimonials = [
  {
    quote: 'GateFlow 让我们的订阅转化率在 30 天内提升了 42%。可视化编辑器让产品团队无需等待工程师就能快速迭代付费墙。',
    author: '张明',
    role: 'CTO, AppGrow',
  },
  {
    quote: '从自建付费墙迁移到 GateFlow，团队节省了 60% 的开发时间。AI 实验功能简直是增长团队的作弊器。',
    author: 'Sarah Chen',
    role: 'Head of Growth, StreamPro',
  },
];

export function TrustSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#0a0a0f]">
      <Container className="text-center">
        <SectionLabel>值得信赖</SectionLabel>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          全球顶尖产品团队的
          <GradientText>共同选择</GradientText>
        </h2>
        <p className="text-slate-400 max-w-[600px] mx-auto mb-16 text-lg">
          从小型创业公司到大型企业，GateFlow 为各种规模的产品提供可靠的付费墙基础设施。
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {trustStats.map((stat) => (
            <div key={stat.label} className="text-center p-6">
              <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 max-w-[900px] mx-auto text-left">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-2xl bg-[#12121a] border border-white/[0.06] p-8 relative">
              <svg className="w-8 h-8 text-purple-500/20 mb-4" fill="currentColor" viewBox="0 0 32 32">
                <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm12 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
              </svg>
              <p className="text-slate-300 leading-relaxed mb-6">{t.quote}</p>
              <div>
                <div className="font-semibold text-sm">{t.author}</div>
                <div className="text-xs text-slate-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
