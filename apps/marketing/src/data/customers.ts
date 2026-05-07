export interface CustomerCase {
  name: string;
  industry: string;
  logo: string;
  quote: string;
  author: string;
  role: string;
  stats: { value: string; label: string }[];
}

export const customers: CustomerCase[] = [
  {
    name: 'AppGrow',
    industry: '社交',
    logo: '',
    quote: 'GateFlow 让我们的订阅转化率在 30 天内提升了 42%。可视化编辑器让产品团队无需等待工程师就能快速迭代付费墙。',
    author: '张明',
    role: 'CTO',
    stats: [
      { value: '42%', label: '转化提升' },
      { value: '3 天', label: '集成时间' },
      { value: '150%', label: 'ARPU 增长' },
    ],
  },
  {
    name: 'StreamPro',
    industry: '视频',
    logo: '',
    quote: '从自建付费墙迁移到 GateFlow，团队节省了 60% 的开发时间。AI 实验功能简直是增长团队的作弊器。',
    author: 'Sarah Chen',
    role: 'Head of Growth',
    stats: [
      { value: '60%', label: '开发时间节省' },
      { value: '28%', label: '转化提升' },
      { value: '¥200K', label: '年成本节省' },
    ],
  },
  {
    name: 'FitLife',
    industry: '健康',
    logo: '',
    quote: '作为一家健身应用，我们需要灵活的付费墙来测试不同的定价策略。GateFlow 的 A/B 实验让我们找到了最佳的定价组合。',
    author: '李伟',
    role: 'Product Manager',
    stats: [
      { value: '35%', label: '订阅增长' },
      { value: '12', label: '实验运行中' },
      { value: '4.8/5', label: '用户满意度' },
    ],
  },
  {
    name: 'EduMind',
    industry: '教育',
    logo: '',
    quote: '跨平台订阅管理是我们选择 GateFlow 的主要原因。App Store、Google Play 和微信支付的统一管理大大简化了运营。',
    author: '王芳',
    role: 'VP of Engineering',
    stats: [
      { value: '3x', label: '运营效率提升' },
      { value: '50万+', label: '活跃订阅者' },
      { value: '99.99%', label: '支付成功率' },
    ],
  },
];
