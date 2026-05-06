export interface DocSection {
  title: string;
  items: { title: string; slug: string }[];
}

export interface DocContent {
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
}

export const docSidebar: DocSection[] = [
  {
    title: '快速开始',
    items: [
      { title: '产品介绍', slug: 'getting-started' },
      { title: 'SDK 快速集成', slug: 'sdk-quickstart' },
      { title: '核心概念', slug: 'core-concepts' },
    ],
  },
  {
    title: '付费墙',
    items: [
      { title: '可视化编辑器', slug: 'paywall-editor' },
      { title: '模板库', slug: 'paywall-templates' },
      { title: '展示规则', slug: 'paywall-rules' },
    ],
  },
  {
    title: '实验系统',
    items: [
      { title: 'A/B 实验入门', slug: 'experiments-overview' },
      { title: '多变量测试', slug: 'experiments-multivariate' },
      { title: '多臂老虎机', slug: 'experiments-bandit' },
    ],
  },
  {
    title: 'SDK 参考',
    items: [
      { title: 'iOS SDK', slug: 'sdk-ios' },
      { title: 'Android SDK', slug: 'sdk-android' },
      { title: 'React Native SDK', slug: 'sdk-react-native' },
    ],
  },
  {
    title: 'API 参考',
    items: [
      { title: '认证方式', slug: 'api-auth' },
      { title: '事件追踪', slug: 'api-events' },
      { title: '用户管理', slug: 'api-users' },
    ],
  },
];

const docs: Record<string, DocContent> = {
  'getting-started': {
    title: '产品介绍',
    description: '了解 GateFlow 的核心功能和基本概念。',
    sections: [
      {
        heading: '什么是 GateFlow？',
        body: 'GateFlow 是面向移动应用与 Web 产品的一站式付费墙基础设施平台。它提供了从付费墙设计、A/B 实验、AI 优化到订阅管理的完整解决方案。通过一次集成，你的产品即可获得所有变现增长所需的能力。',
      },
      {
        heading: '核心能力',
        body: 'GateFlow 提供五大核心能力：可视化编辑器（拖拽构建付费墙）、实验系统（多变量 A/B 测试）、AI 引擎（文案生成与推荐）、订阅管理（跨平台权益同步）和实时分析（秒级数据更新）。',
      },
      {
        heading: '适用场景',
        body: '无论你是一个人的独立开发者，还是大型产品团队，GateFlow 都能提供合适的方案。从简单的付费墙展示到复杂的多变量实验，从 iOS 原生到 Web 应用，我们覆盖了完整的付费墙使用场景。',
      },
    ],
  },
  'sdk-quickstart': {
    title: 'SDK 快速集成',
    description: '在 5 分钟内完成 GateFlow SDK 的集成。',
    sections: [
      {
        heading: '安装 SDK',
        body: 'GateFlow 提供 iOS、Android、React Native 和 Web 四种平台的 SDK。iOS 使用 CocoaPods，Android 使用 Gradle，React Native 和 Web 使用 npm 安装。所有平台的 API 保持一致，降低学习成本。',
      },
      {
        heading: '初始化',
        body: '导入 SDK 后，使用你的 API Key 和 Environment 参数调用 init 方法。建议在应用启动时完成初始化，确保付费墙随时可用。',
      },
      {
        heading: '展示第一个付费墙',
        body: '初始化完成后，调用 showPaywall 方法并传入你创建的付费墙 ID。SDK 会自动处理渲染、用户状态检测和转化追踪。你也可以通过配置参数来自定义展示行为。',
      },
    ],
  },
  'core-concepts': {
    title: '核心概念',
    description: '理解 GateFlow 中的关键概念。',
    sections: [
      {
        heading: '付费墙（Paywall）',
        body: '付费墙是决定向用户展示什么订阅引导的核心载体。它由一个或多个页面组成，包含定价信息、功能列表和 CTA 按钮。每个付费墙可以有多个变体用于 A/B 实验。',
      },
      {
        heading: '实验（Experiment）',
        body: '实验允许你同时测试多个付费墙变体，通过统计显著性分析找到最优方案。GateFlow 支持 A/B 测试、多变量测试和多臂老虎机三种实验模式。',
      },
      {
        heading: '受众（Audience）',
        body: '受众是一组定义了特定条件的用户集合。你可以基于用户属性、行为事件和自定义标签创建受众，然后将不同的付费墙或实验定向到不同的受众。',
      },
    ],
  },
  'paywall-editor': {
    title: '可视化编辑器',
    description: '使用拖拽编辑器构建精美的付费墙。',
    sections: [
      {
        heading: '编辑器概览',
        body: 'GateFlow 编辑器提供拖拽式界面，你可以从 200+ 模板开始，自由组合元素构建付费墙。编辑器同时支持布局调整、样式定制和实时预览。',
      },
      {
        heading: '模板系统',
        body: '模板库包含多种风格的付费墙设计，从简洁的信息流到丰富的多媒体展示。所有模板都是可定制的，你可以修改颜色、字体、图片和文案。',
      },
    ],
  },
  'paywall-templates': {
    title: '模板库',
    description: '浏览和使用付费墙模板。',
    sections: [
      {
        heading: '模板分类',
        body: '模板按风格和场景分类：信息流式、全屏式、底部弹窗式、视频引导式和游戏化式。每种风格适用于不同的产品和用户场景。',
      },
      {
        heading: '自定义模板',
        body: '你可以从任意模板开始，通过编辑器进行二次创作。修改后的模板可以保存为自定义模板，供团队复用。',
      },
    ],
  },
};

export function getDocContent(slug: string): DocContent | undefined {
  return docs[slug];
}
