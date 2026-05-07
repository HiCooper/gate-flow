import { Link, useLocation } from 'react-router-dom';
import { cn } from '@gate-flow/shared';
import {
  LayoutDashboard,
  Layers,
  LayoutTemplate,
  FlaskConical,
  Users,
  Settings,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Play,
} from 'lucide-react';

const mainNavItems = [
  { label: '快速开始', to: '/quickstart', icon: Play },
  { label: '仪表盘', to: '/', icon: LayoutDashboard },
  { label: '付费墙', to: '/paywalls', icon: Layers },
  { label: '模板', to: '/templates', icon: LayoutTemplate },
  { label: '实验', to: '/experiments', icon: FlaskConical },
  { label: '受众', to: '/audience', icon: Users },
  { label: '设置', to: '/settings', icon: Settings },
];

const secondaryNavItems = [
  { label: '文档', icon: BookOpen, href: '#' },
  { label: '社区', icon: MessageCircle, href: '#' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 shrink-0 bg-surface-1 border border-border-subtle rounded-2xl flex flex-col h-full select-none overflow-hidden">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border-subtle">
        <div className="w-7 h-7 bg-gradient-to-br from-accent-400 to-accent-600 rounded-md flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">GateFlow</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent-400/8 text-accent-400'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-accent-400' : 'text-text-muted')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Secondary Nav */}
      <div className="px-3 py-3 border-t border-border-subtle space-y-0.5">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-all duration-150 font-medium"
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
              <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
            </a>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="px-3 pb-4 pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent-400/15 flex items-center justify-center text-xs font-bold text-accent-400">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">Admin</div>
            <div className="text-[11px] text-text-muted truncate">admin@gateflow.dev</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
