export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  author: string;
  readTime: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'ai-paywall-optimization-guide',
    title: 'AI 驱动的付费墙优化：从理论到实践',
    excerpt: '探索如何利用 AI 自动生成文案、推荐实验方向，实现付费墙转化率的持续提升。',
    date: '2026-04-28',
    category: '产品',
    author: 'GateFlow Team',
    readTime: '8 min',
    content: '在移动应用变现领域，付费墙的设计和优化一直是一个需要大量人力和时间投入的环节。传统做法依赖产品经理的直觉和设计师的反复迭代，一个高质量的付费墙往往需要数周时间才能上线。而 AI 技术的成熟正在彻底改变这一现状...',
  },
  {
    slug: 'ab-testing-best-practices',
    title: 'A/B 实验最佳实践：避开 5 个常见陷阱',
    excerpt: '从样本量计算到统计显著性，了解如何设计可靠的 A/B 实验并避免常见错误。',
    date: '2026-04-20',
    category: '增长',
    author: 'GateFlow Team',
    readTime: '6 min',
    content: 'A/B 实验是增长团队最重要的武器之一。但很多团队在实施过程中会犯一些基础性错误，导致实验结论不可靠甚至产生误导。本文将分享我们在服务客户过程中总结的 5 个最常见陷阱...',
  },
  {
    slug: 'subscription-management-guide',
    title: '跨平台订阅管理完全指南',
    excerpt: '如何统一管理 App Store、Google Play 和第三方支付的订阅状态，实现权益自动同步。',
    date: '2026-04-12',
    category: '技术',
    author: 'GateFlow Team',
    readTime: '10 min',
    content: '随着移动应用生态的多元化，越来越多的产品同时面向 iOS 和 Android 用户，甚至扩展到了 Web 端。跨平台订阅管理成为了一个不可回避的技术挑战。本文将从架构设计、技术选型到实际实现，全面解析跨平台订阅管理的方案...',
  },
  {
    slug: 'paywall-templates-showcase',
    title: '10 个高转化付费墙模板深度解析',
    excerpt: '从信息流到全屏引导，解析 10 个经过验证的高转化付费墙模板及其适用场景。',
    date: '2026-04-05',
    category: '设计',
    author: 'GateFlow Team',
    readTime: '12 min',
    content: '一个优秀的付费墙设计能让转化率提升 30% 以上。但什么才是"好"的设计？这个问题没有标准答案——它取决于你的产品形态、用户群体和变现策略。我们分析了 10 个经过实际验证的高转化模板...',
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
