import { Card, Container } from '@gate-flow/shared';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';
import { Brain, Gauge, Boxes, Zap, Eye, Workflow } from 'lucide-react';

const differentiators = [
  {
    icon: Boxes,
    title: '一站式 vs 拼凑工具',
    description: '无需集成多个厂商的 SDK——付费墙设计、实验、分析和订阅管理都在一个平台完成。',
  },
  {
    icon: Brain,
    title: 'AI 原生 vs 事后嫁接',
    description: 'AI 引擎从第一天就深度集成，不仅仅是 ChatBot 套壳，而是真正的实验推荐与文案生成。',
  },
  {
    icon: Gauge,
    title: '实时分析 vs 日级延迟',
    description: '秒级更新的转化数据，支持实时实验决策，不需要等到第二天才能看到昨天的数据。',
  },
  {
    icon: Zap,
    title: '双渲染引擎',
    description: '同时支持原生 SDK 渲染和 Web 渲染，前者性能极致，后者迭代零延迟，灵活切换。',
  },
  {
    icon: Eye,
    title: '透明可控 vs 黑盒算法',
    description: '所有实验数据、AI 推荐理由完全透明，你可以理解为什么算法给出这个建议。',
  },
  {
    icon: Workflow,
    title: '权益引擎 vs 简单状态同步',
    description: '跨平台订阅权益自动同步，复杂订阅场景（试用、优惠、升级）开箱即用。',
  },
];

export function Differentiators() {
  return (
    <section className="py-24 lg:py-32">
      <Container className="text-center">
        <SectionLabel>为什么选择 GateFlow</SectionLabel>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          不只是工具，
          <GradientText>更是增长引擎</GradientText>
        </h2>
        <p className="text-slate-400 max-w-[600px] mx-auto mb-16 text-lg">
          市面上有很多付费墙工具，但 GateFlow 在产品理念上有着根本的不同。
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {differentiators.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.title} hover padding="lg">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{d.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{d.description}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
