import { useState } from 'react';
import { Check, Copy, ChevronRight, Terminal, ArrowRight, Play, Code, Puzzle, BarChart3, Zap } from 'lucide-react';

const steps = [
  {
    id: 'install',
    title: '安装 SDK',
    desc: '通过你喜欢的包管理器安装 GateFlow SDK。',
    icon: Terminal,
    code: `npm install @gate-flow/core\n# 或\npnpm add @gate-flow/core`,
  },
  {
    id: 'init',
    title: '初始化配置',
    desc: '使用你的 API Key 初始化 GateFlow。',
    icon: Code,
    code: `import { GateFlow } from '@gate-flow/core';\n\nconst gf = GateFlow.init({\n  apiKey: 'gf_live_xxxxxxxxxxxx',\n  environment: 'production',\n});`,
  },
  {
    id: 'paywall',
    title: '创建你的第一个付费墙',
    desc: '在控制台创建付费墙，或选择一个模板快速开始。',
    icon: Puzzle,
    code: `await gf.showPaywall('pw_pro_monthly', {\n  onClose: () => console.log('关闭'),\n  onPurchase: (tier) => console.log('购买:', tier),\n});`,
  },
  {
    id: 'track',
    title: '追踪关键事件',
    desc: '设置事件追踪来优化你的变现策略。',
    icon: BarChart3,
    code: `gf.track('trial_started', {\n  plan: 'pro_monthly',\n  source: 'onboarding',\n});`,
  },
  {
    id: 'test',
    title: '运行 A/B 实验',
    desc: '创建实验来测试不同付费墙的转化效果。',
    icon: Zap,
    code: `gf.experiment('exp_homepage_v2', {\n  variants: ['control', 'variant_a'],\n  metric: 'conversion_rate',\n});`,
  },
];

const quickLinks = [
  { label: 'SDK 文档', desc: '查看完整 API 参考和集成指南', href: '#' },
  { label: '模板市场', desc: '浏览 50+ 个预制模板', href: '/templates' },
  { label: '示例项目', desc: '下载 iOS / Android / React 示例', href: '#' },
  { label: '视频教程', desc: '观看快速入门系列视频', href: '#' },
];

const resources = [
  { label: 'Discord 社区', desc: '加入开发者社区，获取实时帮助', href: '#' },
  { label: 'API 状态', desc: '查看实时服务状态和延迟', href: '#' },
  { label: '更新日志', desc: '了解最新的功能更新和修复', href: '#' },
];

export function QuickstartPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl space-y-10">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent-400/15 flex items-center justify-center">
            <Play className="w-4 h-4 text-accent-400" />
          </div>
          <span className="text-xs font-medium text-accent-400 uppercase tracking-wider">快速开始</span>
        </div>
        <h1 className="text-[28px] font-extrabold tracking-tight mb-2">欢迎使用 GateFlow</h1>
        <p className="text-text-muted text-sm leading-relaxed max-w-lg">
          只需 5 分钟即可集成付费墙，开始优化你的应用内购买转化。
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full w-0 bg-accent-400 rounded-full" />
        </div>
        <span className="text-xs text-text-muted shrink-0">0/5 完成</span>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.id} className="rounded-2xl bg-surface-2 border border-border-subtle p-5 group hover:border-accent-400/15 transition-colors">
            <div className="flex items-start gap-4">
              {/* Step number */}
              <div className="w-8 h-8 rounded-xl bg-accent-400/8 border border-accent-400/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent-400">{i + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <step.icon className="w-4 h-4 text-accent-400" />
                  <h3 className="font-bold text-sm">{step.title}</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">{step.desc}</p>

                {/* Code block */}
                <div className="relative rounded-xl bg-surface-0 border border-border-subtle overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Terminal</span>
                    <button
                      onClick={() => handleCopy(step.id, step.code)}
                      className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-primary transition-colors"
                    >
                      {copied === step.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-text-primary leading-relaxed overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>

              {/* Action */}
              <button className="shrink-0 w-8 h-8 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent-400 hover:border-accent-400/20 transition-colors opacity-0 group-hover:opacity-100">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-bold mb-4">快速链接</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border-subtle hover:border-accent-400/15 hover:bg-surface-3 transition-all group"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium mb-0.5">{link.label}</div>
                <div className="text-xs text-text-muted truncate">{link.desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted shrink-0 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-sm font-bold mb-4">更多资源</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {resources.map((res) => (
            <a
              key={res.label}
              href={res.href}
              className="p-4 rounded-xl bg-surface-2 border border-border-subtle hover:border-border-default hover:bg-surface-3 transition-all"
            >
              <div className="text-sm font-medium mb-0.5">{res.label}</div>
              <div className="text-xs text-text-muted">{res.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
