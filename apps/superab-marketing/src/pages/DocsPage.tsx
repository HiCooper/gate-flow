import { Link } from 'react-router-dom';
import { Container, Card } from '@gate-flow/shared';
import { BookOpen, Code, Palette, FlaskConical, ChevronRight, Smartphone } from 'lucide-react';

const categories = [
  {
    title: '快速开始',
    description: '了解 GateFlow 的基本概念，完成首次集成。',
    icon: BookOpen,
    slug: 'getting-started',
    count: 3,
  },
  {
    title: '付费墙',
    description: '学习如何使用编辑器、模板和展示规则构建付费墙。',
    icon: Palette,
    slug: 'paywall-editor',
    count: 3,
  },
  {
    title: '实验系统',
    description: '掌握 A/B 实验、多变量测试和多臂老虎机。',
    icon: FlaskConical,
    slug: 'experiments-overview',
    count: 3,
  },
  {
    title: 'SDK 参考',
    description: '各平台 SDK 的安装、配置和 API 文档。',
    icon: Smartphone,
    slug: 'sdk-ios',
    count: 3,
  },
  {
    title: 'API 参考',
    description: 'REST API 的认证方式、事件追踪和用户管理。',
    icon: Code,
    slug: 'api-auth',
    count: 3,
  },
];

export function DocsPage() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">文档</h1>
      <p className="text-slate-400 mb-12 max-w-[600px] leading-relaxed">
        从快速开始到高级用法，了解如何使用 GateFlow 构建、优化和扩展你的付费墙系统。
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link key={cat.slug} to={`/docs/${cat.slug}`}>
              <Card hover padding="lg" className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1">{cat.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{cat.description}</p>
                    <span className="text-xs text-slate-600">{cat.count} 篇文章</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
