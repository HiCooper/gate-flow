export interface PricingTier {
  name: string;
  price: string;
  priceLabel: string;
  description: string;
  cta: string;
  highlighted?: boolean;
  features: { text: string; included: boolean }[];
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '¥0',
    priceLabel: '/月',
    description: '适合个人开发者和小项目，免费开始使用。',
    cta: '免费开始',
    features: [
      { text: '3 个付费墙设计', included: true },
      { text: '基础模板库', included: true },
      { text: '1,000 MAU', included: true },
      { text: '基础分析面板', included: true },
      { text: '社区支持', included: true },
      { text: 'A/B 实验', included: false },
      { text: 'AI 优化', included: false },
      { text: '高级定向', included: false },
      { text: '订阅管理', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '¥299',
    priceLabel: '/月',
    description: '适合成长中的产品团队，解锁实验与优化能力。',
    cta: '开始试用',
    features: [
      { text: '无限付费墙设计', included: true },
      { text: '全部模板库', included: true },
      { text: '10,000 MAU', included: true },
      { text: '高级分析面板', included: true },
      { text: '邮件支持', included: true },
      { text: 'A/B 实验（5 个并发）', included: true },
      { text: '基础 AI 文案生成', included: true },
      { text: '高级定向', included: false },
      { text: '订阅管理', included: false },
    ],
  },
  {
    name: 'Growth',
    price: '¥999',
    priceLabel: '/月',
    description: '适合规模化变现团队，全面解锁 AI 与高级功能。',
    cta: '开始试用',
    highlighted: true,
    features: [
      { text: '无限付费墙设计', included: true },
      { text: '全部模板 + 自定义', included: true },
      { text: '50,000 MAU', included: true },
      { text: '实时分析 + 导出', included: true },
      { text: '优先支持', included: true },
      { text: 'A/B 实验（无限）', included: true },
      { text: '完整 AI 优化引擎', included: true },
      { text: '高级受众定向', included: true },
      { text: '跨平台订阅管理', included: true },
    ],
  },
  {
    name: 'Scale',
    price: '定制',
    priceLabel: '',
    description: '适合大型企业与高流量应用，专属支持与定制方案。',
    cta: '联系销售',
    features: [
      { text: '无限付费墙设计', included: true },
      { text: '白标定制', included: true },
      { text: '无限 MAU', included: true },
      { text: '专属数据仓库', included: true },
      { text: '专属客户经理', included: true },
      { text: 'A/B 实验（无限）', included: true },
      { text: '自定义 AI 模型', included: true },
      { text: '企业级定向引擎', included: true },
      { text: '高级权益引擎 + SLA', included: true },
    ],
  },
];

export const pricingFAQ = [
  {
    q: '免费版有什么限制？',
    a: '免费版支持 3 个付费墙设计、1,000 MAU 和基础分析功能。当你需要更多付费墙、更高流量或高级功能（如 A/B 实验）时，可以升级到付费版本。',
  },
  {
    q: '如何计算 MAU？',
    a: 'MAU（月活跃用户）指在计费周期内至少与付费墙交互一次的唯一用户数。我们只统计实际触发了付费墙展示的用户，不会计入未触发 SDK 的用户。',
  },
  {
    q: '支持哪些支付渠道？',
    a: '我们支持 App Store、Google Play、支付宝、微信支付和 Stripe。Growth 及以上版本支持跨平台订阅管理与权益同步。',
  },
  {
    q: '可以随时升级或降级吗？',
    a: '是的，你可以随时在控制台中切换套餐。升级立即生效，降级会在当前计费周期结束后生效。我们不会锁定任何数据，你可以随时导出。',
  },
  {
    q: '数据安全如何保障？',
    a: 'GateFlow 已通过 SOC 2 Type II 认证，所有数据传输采用 TLS 1.3 加密，数据存储采用 AES-256 加密。我们不会使用你的数据训练 AI 模型。',
  },
  {
    q: '有免费试用期吗？',
    a: 'Pro 和 Growth 版本提供 14 天免费试用，无需信用卡。试用期结束后，你可以选择付费继续使用或降级到免费版。',
  },
];
