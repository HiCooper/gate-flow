import { Container } from '@gate-flow/shared';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';

const layers = [
  {
    label: 'iOS App',
    color: 'bg-purple-500/60',
  },
  {
    label: 'Android App',
    color: 'bg-cyan-500/60',
  },
  {
    label: 'React Native',
    color: 'bg-amber-500/60',
  },
  {
    label: 'Web App',
    color: 'bg-emerald-500/60',
  },
];

const services = [
  { name: 'Paywall Engine', desc: '渲染 & 配置' },
  { name: 'Experiment Engine', desc: 'A/B & 多臂老虎机' },
  { name: 'AI Engine', desc: '文案 & 推荐' },
  { name: 'Subscription Hub', desc: '支付 & 权益' },
  { name: 'Analytics Engine', desc: '实时 & 预测' },
];

export function ArchitectureDiagram() {
  return (
    <section className="py-24 lg:py-32 bg-[#0a0a0f]">
      <Container className="text-center">
        <SectionLabel>系统架构</SectionLabel>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          为规模化而生的
          <GradientText>技术架构</GradientText>
        </h2>
        <p className="text-slate-400 max-w-[600px] mx-auto mb-16 text-lg">
          GateFlow 采用云端引擎 + 端侧 SDK 的混合架构，兼顾性能与灵活性。
        </p>

        {/* Architecture Diagram */}
        <div className="max-w-[800px] mx-auto">
          {/* Client Layer */}
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Client Layer</div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {layers.map((l) => (
                <div key={l.label} className={`px-5 py-2.5 rounded-xl ${l.color} text-sm font-semibold text-white`}>
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-4">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>

          {/* SDK Layer */}
          <div className="mb-4">
            <div className="px-8 py-4 rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-500/[0.03] inline-block">
              <span className="text-sm font-bold text-purple-400">GateFlow SDK</span>
              <span className="text-xs text-slate-500 ml-2">统一的端侧接口</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-4">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>

          {/* Cloud Layer */}
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Cloud Layer</div>
            <div className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-8">
              <div className="text-sm font-semibold text-slate-400 mb-6">GateFlow API Gateway</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {services.map((s) => (
                  <div key={s.name} className="rounded-xl bg-[#1a1a2e] border border-white/[0.04] p-4 text-left">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mb-2" />
                    <div className="text-xs font-bold mb-0.5">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-4">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>

          {/* Admin Layer */}
          <div>
            <div className="px-8 py-4 rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-500/[0.03] inline-block">
              <span className="text-sm font-bold text-purple-400">GateFlow Console</span>
              <span className="text-xs text-slate-500 ml-2">管理与分析平台</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
