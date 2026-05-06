import { Container } from '@gate-flow/shared';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';
import { Check, X, Minus } from 'lucide-react';

type supportLevel = 'full' | 'partial' | 'none';

const rows = [
  { feature: '无代码可视化编辑器', gateflow: 'full', rc: 'partial', adapty: 'partial', custom: 'none' },
  { feature: '多变量 A/B 实验', gateflow: 'full', rc: 'full', adapty: 'full', custom: 'none' },
  { feature: 'AI 文案生成与推荐', gateflow: 'full', rc: 'none', adapty: 'none', custom: 'none' },
  { feature: '多臂老虎机自动优化', gateflow: 'full', rc: 'none', adapty: 'none', custom: 'none' },
  { feature: '50+ 自动追踪属性', gateflow: 'full', rc: 'partial', adapty: 'partial', custom: 'partial' },
  { feature: '跨平台订阅管理', gateflow: 'full', rc: 'full', adapty: 'full', custom: 'partial' },
  { feature: '实时分析仪表盘', gateflow: 'full', rc: 'partial', adapty: 'partial', custom: 'none' },
  { feature: '原生 + Web 双渲染引擎', gateflow: 'full', rc: 'none', adapty: 'none', custom: 'partial' },
  { feature: '权益引擎', gateflow: 'full', rc: 'partial', adapty: 'none', custom: 'none' },
  { feature: 'LTV 预测', gateflow: 'full', rc: 'partial', adapty: 'none', custom: 'none' },
];

const columns = [
  { key: 'gateflow', label: 'GateFlow' },
  { key: 'rc', label: 'RevenueCat' },
  { key: 'adapty', label: 'Adapty' },
  { key: 'custom', label: '自建' },
] as const;

function SupportIcon({ level }: { level: supportLevel }) {
  switch (level) {
    case 'full':
      return <Check className="w-5 h-5 text-emerald-400" />;
    case 'partial':
      return <Minus className="w-5 h-5 text-amber-400" />;
    case 'none':
      return <X className="w-5 h-5 text-slate-600" />;
  }
}

export function ComparisonSection() {
  return (
    <section className="py-24 lg:py-32">
      <Container className="text-center">
        <SectionLabel>功能对比</SectionLabel>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          不只是替代方案，
          <GradientText>更是全新物种</GradientText>
        </h2>
        <p className="text-slate-400 max-w-[600px] mx-auto mb-16 text-lg">
          与市面上的付费墙工具相比，GateFlow 在 AI 能力和一体化程度上遥遥领先。
        </p>

        {/* Table */}
        <div className="max-w-[900px] mx-auto rounded-2xl border border-white/[0.06] bg-[#12121a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">功能</th>
                  {columns.map((col) => (
                    <th key={col.key} className="px-6 py-4 text-sm font-semibold text-center">
                      <span className={col.key === 'gateflow' ? 'gradient-text' : 'text-slate-400'}>
                        {col.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-6 py-4 text-sm text-slate-300">{row.feature}</td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <SupportIcon level={row[col.key as keyof typeof row] as supportLevel} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </section>
  );
}
