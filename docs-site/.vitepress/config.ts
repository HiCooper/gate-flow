import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'GateFlow',
  description: 'A/B 测试实验平台文档',
  base: '/',
  lang: 'zh-CN',

  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    // 导航栏
    nav: [
      { text: '产品指南', link: '/guide/', activeMatch: '^/guide/' },
      { text: '技术文档', link: '/dev/', activeMatch: '^/dev/' },
      { text: '内部知识', link: '/knowledge/', activeMatch: '^/knowledge/' },
      { text: '分析报告', link: '/analysis-reports/', activeMatch: '^/analysis-reports/' },
    ],

    // 侧边栏 - 产品指南
    sidebar: {
      '/guide/': [
        {
          text: '产品指南',
          items: [
            { text: '产品概述', link: '/guide/what-is-gateflow' },
            { text: '快速开始', link: '/guide/getting-started' },
          ],
        },
        {
          text: '实验管理',
          items: [
            { text: '创建实验', link: '/guide/experiment-management/create-experiment' },
            { text: '流量分配', link: '/guide/experiment-management/traffic-allocation' },
            { text: '实验生命周期', link: '/guide/experiment-management/lifecycle' },
          ],
        },
        {
          text: '分析报告',
          items: [
            { text: '阅读实验报告', link: '/guide/analysis/reading-reports' },
            { text: '统计显著性', link: '/guide/analysis/statistical-significance' },
            { text: '序贯检验', link: '/guide/analysis/sequential-testing' },
            { text: '方差缩减', link: '/guide/analysis/variance-reduction' },
          ],
        },
        {
          text: '其他',
          items: [
            { text: '流量地图', link: '/guide/traffic-map' },
            { text: '权限与协作', link: '/guide/rbac-collaboration' },
            { text: '最佳实践', link: '/guide/best-practices' },
            { text: '常见问题', link: '/guide/faq' },
          ],
        },
      ],
      '/dev/': [
        {
          text: 'AB实验系统',
          items: [
            { text: '概述', link: '/dev/ab-system/' },
            { text: '系统架构', link: '/dev/ab-system/architecture' },
            { text: '分流引擎', link: '/dev/ab-system/bucketing-engine' },
            { text: '统计引擎', link: '/dev/ab-system/stats-engine' },
            { text: '离线计算任务', link: '/dev/ab-system/stats-offline-design' },
            { text: '全链路追踪', link: '/dev/ab-system/observability' },
            { text: '追踪方案对比', link: '/dev/ab-system/tracing-comparison' },
            { text: '数据模型', link: '/dev/ab-system/data-model' },
            { text: '模块设计', link: '/dev/ab-system/module-design' },
            { text: '实验管理平台', link: '/dev/ab-system/experiment-platform' },
            { text: 'API 参考', link: '/dev/ab-system/api' },
          ],
        },
        {
          text: 'SDK 集成',
          items: [
            { text: 'SDK 概览', link: '/dev/ab-system/sdk-integration/' },
            { text: 'Java SDK', link: '/dev/ab-system/sdk-integration/java-sdk' },
            { text: 'iOS SDK', link: '/dev/ab-system/sdk-integration/ios-sdk' },
            { text: 'Android SDK', link: '/dev/ab-system/sdk-integration/android-sdk' },
            { text: 'Expo SDK', link: '/dev/ab-system/sdk-integration/expo-sdk' },
          ],
        },
        {
          text: 'SDK 开发',
          items: [
            { text: 'SDK 架构原则', link: '/dev/ab-system/sdk-development/' },
            { text: '可移植核心', link: '/dev/ab-system/sdk-development/portable-core' },
            { text: '平台层', link: '/dev/ab-system/sdk-development/platform-layers' },
          ],
        },
        {
          text: '埋点分析系统',
          items: [
            { text: '概述', link: '/dev/analytics-system/' },
            { text: '系统架构', link: '/dev/analytics-system/architecture' },
            { text: '事件管道', link: '/dev/analytics-system/event-pipeline' },
            { text: '数据模型', link: '/dev/analytics-system/data-model' },
            { text: 'SDK 设计', link: '/dev/analytics-system/sdk-design' },
            { text: '服务端设计', link: '/dev/analytics-system/server-design' },
            { text: 'Kafka 设计', link: '/dev/analytics-system/kafka-design' },
            { text: '会话管理', link: '/dev/analytics-system/session-design' },
            { text: 'Redis 集群', link: '/dev/analytics-system/redis-cluster' },
            { text: 'DLQ 重放', link: '/dev/analytics-system/dlq-replay' },
            { text: '埋点路径规范', link: '/dev/analytics-system/spm-spec' },
            { text: '产品指南', link: '/dev/analytics-system/product-guide' },
            { text: '部署运维', link: '/dev/analytics-system/deployment' },
            { text: 'AB 分析 SQL 示例', link: '/dev/analytics-system/ab-analysis-sql' },
          ],
        },
        {
          text: '架构总览',
          items: [
            { text: '整体架构', link: '/dev/architecture/' },
            { text: '前端架构', link: '/dev/architecture/frontend-arch' },
          ],
        },
        {
          text: '开发环境',
          items: [
            { text: '快速开始', link: '/dev/getting-started/' },
            { text: '本地开发', link: '/dev/getting-started/local-setup' },
            { text: 'Docker 部署', link: '/dev/getting-started/docker-setup' },
          ],
        },
        {
          text: '前端开发',
          items: [
            { text: '管理控制台', link: '/dev/frontend-dev/admin-dashboard' },
            { text: '营销站点', link: '/dev/frontend-dev/marketing-site' },
            { text: '共享组件库', link: '/dev/frontend-dev/shared-package' },
          ],
        },
        {
          text: '后端开发',
          items: [
            { text: '编码规范', link: '/dev/backend-dev/coding-standards' },
            { text: '添加新接口', link: '/dev/backend-dev/adding-endpoint' },
            { text: '数据库迁移', link: '/dev/backend-dev/db-migrations' },
            { text: '测试指南', link: '/dev/backend-dev/testing-guide' },
          ],
        },
        {
          text: '部署运维',
          items: [
            { text: '生产部署', link: '/dev/deployment/production' },
            { text: '环境配置', link: '/dev/deployment/environments' },
            { text: '监控告警', link: '/dev/deployment/monitoring' },
            { text: '运维手册', link: '/dev/deployment/runbook' },
          ],
        },
        {
          text: '贡献指南',
          items: [
            { text: '如何贡献', link: '/dev/contributing/' },
            { text: 'Git Submodule', link: '/dev/contributing/git-submodule' },
            { text: 'PR 工作流', link: '/dev/contributing/pr-workflow' },
            { text: '提交规范', link: '/dev/contributing/commit-conventions' },
            { text: 'AI 协作实践', link: '/dev/contributing/ai-collaboration' },
          ],
        },
      ],
      '/analysis-reports/': [
        {
          text: '分析报告',
          items: [
            { text: '报告列表', link: '/analysis-reports/' },
            { text: '2026-05-26 生产就绪度评估', link: '/analysis-reports/2026-05-26-gateflow-production-readiness-assessment' },
          ],
        },
      ],
      '/knowledge/': [
        {
          text: '快速链接',
          items: [
            { text: '服务访问入口', link: '/knowledge/service-endpoints' },
          ],
        },
        {
          text: '内部知识',
          items: [
            { text: '业务领域知识', link: '/knowledge/business-domain/' },
            { text: '历史踩坑记录', link: '/knowledge/historical-lessons/' },
            { text: '外部参考资料', link: '/knowledge/external-resources/' },
            { text: '架构决策记录', link: '/knowledge/adr/' },
          ],
        },
      ],
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/HiCooper/gate-flow' },
    ],

    // 搜索
    search: {
      provider: 'local',
    },

    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present GateFlow Team',
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/HiCooper/gate-flow/edit/main/docs/docs-site/:path',
      text: '在 GitHub 上编辑此页',
    },

    // 上下页
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    // 大纲
    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    // 返回顶部的标签
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
  },

  // Markdown 配置
  markdown: {
    lineNumbers: true,
  },

  // 忽略死链检查
  ignoreDeadLinks: true,
}))
