import type { LucideIcon } from 'lucide-react';

export interface Feature {
  title: string;
  description: string;
  iconName: string;
}

export const features: Feature[] = [
  {
    title: '无代码可视化编辑器',
    description: '拖拽式构建付费墙，200+ 模板即用即改，所见即所得，支持原生与 Web 双渲染引擎。',
    iconName: 'LayoutGrid',
  },
  {
    title: '高级 A/B 实验',
    description: '多变量测试价格、文案、设计和时机，智能流量分配，多臂老虎机自动找到最优变体。',
    iconName: 'BarChart3',
  },
  {
    title: 'AI 智能优化',
    description: 'AI 自动生成文案、推荐实验方向、预测获胜变体，实现从手动调优到 AI 自主增长。',
    iconName: 'Sparkles',
  },
  {
    title: '精准受众定向',
    description: '50+ 自动追踪属性，自定义用户标签，行为触发规则，根据转化概率动态决定展示策略。',
    iconName: 'Users',
  },
  {
    title: '订阅管理与权益引擎',
    description: '统一管理 App Store、Google Play、支付宝、微信支付，跨平台权益自动同步。',
    iconName: 'ShieldCheck',
  },
  {
    title: '实时分析仪表盘',
    description: '秒级更新转化数据，LTV 预测，用户路径回溯，行业基准对比，数据驱动每一个决策。',
    iconName: 'Activity',
  },
];
