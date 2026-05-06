import { Card } from '@gate-flow/shared';
import { MessageCircle, Github, Video, BookOpen, Users } from 'lucide-react';

const channels = [
  {
    name: 'Discord 社区',
    description: '加入我们的 Discord 社区，与开发者交流经验，获取官方支持。',
    icon: MessageCircle,
    link: '#',
    color: 'bg-[#5865F2]/10 border-[#5865F2]/20',
    iconColor: 'text-[#5865F2]',
  },
  {
    name: 'GitHub Discussions',
    description: '在 GitHub 上讨论技术问题，提交功能建议和 Bug 报告。',
    icon: Github,
    link: '#',
    color: 'bg-slate-500/10 border-slate-500/20',
    iconColor: 'text-slate-400',
  },
  {
    name: '视频教程',
    description: '观看从入门到高级的系列教程，掌握 GateFlow 的全部功能。',
    icon: Video,
    link: '#',
    color: 'bg-red-500/10 border-red-500/20',
    iconColor: 'text-red-400',
  },
  {
    name: '用户论坛',
    description: '在论坛中分享使用心得、最佳实践和创意方案。',
    icon: Users,
    link: '#',
    color: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    name: '技术博客',
    description: '阅读最新的技术文章、产品更新和增长策略。',
    icon: BookOpen,
    link: '#',
    color: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
];

export function CommunityChannels() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {channels.map((channel) => {
        const Icon = channel.icon;
        return (
          <a key={channel.name} href={channel.link}>
            <Card hover padding="lg" className="h-full">
              <div className={`w-12 h-12 rounded-xl ${channel.color} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${channel.iconColor}`} />
              </div>
              <h3 className="font-bold mb-2">{channel.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{channel.description}</p>
            </Card>
          </a>
        );
      })}
    </div>
  );
}
