import { Container, Button } from '@gate-flow/shared';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';
import { Smartphone, Monitor, Globe, Puzzle, Terminal, ArrowRight } from 'lucide-react';

const platforms = [
  { name: 'iOS', icon: Smartphone },
  { name: 'Android', icon: Smartphone },
  { name: 'React Native', icon: Globe },
  { name: 'Web', icon: Monitor },
];

const steps = [
  {
    title: '安装 SDK',
    description: '通过 CocoaPods、Gradle 或 npm 一键安装',
    icon: Terminal,
  },
  {
    title: '配置触发器',
    description: '在可视化编辑器中设置展示规则',
    icon: Puzzle,
  },
  {
    title: '上线运行',
    description: '发布即可用，实时监控转化数据',
    icon: Monitor,
  },
];

export function SDKSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#0a0a0f]">
      <Container>
        <div className="text-center mb-16">
          <SectionLabel>开发者优先</SectionLabel>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
            <GradientText>5 分钟</GradientText> 完成集成
          </h2>
          <p className="text-slate-400 max-w-[600px] mx-auto text-lg">
            无论你使用什么技术栈，我们都提供了原生级别的 SDK，让集成过程简单丝滑。
          </p>
        </div>

        {/* Code Snippet Mock */}
        <div className="max-w-[640px] mx-auto mb-16 rounded-2xl border border-white/[0.06] bg-[#12121a] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0f]/50">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="ml-3 text-xs text-slate-600">Terminal</span>
          </div>
          <div className="p-6 font-mono text-sm text-slate-300 leading-relaxed">
            <span className="text-slate-500"># iOS - CocoaPods</span>
            <br />
            <span className="text-cyan-400">pod</span> <span className="text-slate-300">'GateFlowSDK'</span>
            <br />
            <br />
            <span className="text-slate-500"># Android - Gradle</span>
            <br />
            <span className="text-slate-300">implementation</span> <span className="text-purple-400">'com.gateflow:sdk:2.0.0'</span>
            <br />
            <br />
            <span className="text-slate-500"># React Native / Web</span>
            <br />
            <span className="text-cyan-400">npm</span> <span className="text-slate-300">install</span> <span className="text-purple-400">@gateflow/sdk</span>
            <br />
            <br />
            <span className="text-slate-500"># 初始化（所有平台统一 API）</span>
            <br />
            <span className="text-cyan-400">import</span> <span className="text-slate-300">GateFlow</span> <span className="text-cyan-400">from</span> <span className="text-purple-400">'@gateflow/sdk'</span>;
            <br />
            <br />
            <span className="text-slate-400">GateFlow</span>.<span className="text-amber-400">init</span>({'{'}
            <br />
            &nbsp;&nbsp;<span className="text-slate-500">apiKey:</span> <span className="text-purple-400">'YOUR_API_KEY'</span>,
            <br />
            &nbsp;&nbsp;<span className="text-slate-500">environment:</span> <span className="text-purple-400">'production'</span>,
            <br />
            {'}'});
          </div>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-8 mb-16">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-xs text-purple-400 font-semibold mb-2">Step {i + 1}</div>
                <h4 className="font-bold mb-2">{step.title}</h4>
                <p className="text-sm text-slate-400">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Platforms */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#12121a] border border-white/[0.06]">
                <Icon className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
