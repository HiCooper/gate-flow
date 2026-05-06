import { Link } from 'react-router-dom';
import { Container } from '@gate-flow/shared';

const footerLinks = {
  '产品': [
    { label: '可视化编辑器', to: '/#features' }, { label: 'A/B 实验', to: '/#features' },
    { label: 'AI 优化', to: '/#features' }, { label: '订阅管理', to: '/#features' }, { label: '分析仪表盘', to: '/#features' },
  ],
  '开发者': [
    { label: '文档', to: '/docs' }, { label: 'API 参考', to: '/docs' },
    { label: '更新日志', to: '/blog' },
  ],
  '公司': [
    { label: '博客', to: '/blog' }, { label: '案例', to: '/customers' },
    { label: '社区', to: '/community' }, { label: '隐私政策', to: '/privacy' }, { label: '服务条款', to: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#12121a] py-16">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
              <div className="w-8 h-8 bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
              </div>
              GateFlow
            </Link>
            <p className="text-sm text-slate-500 mt-4 max-w-[300px] leading-relaxed">
              AI 驱动的付费墙增长基础设施，帮助开发者与产品团队最大化订阅收入。
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">{title}</h4>
              <ul className="flex flex-col gap-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} GateFlow. All rights reserved.</p>
          <div className="flex gap-3">
            {['GitHub', 'Twitter', 'WeChat'].map(social => (
              <a key={social} href="#" className="w-9 h-9 rounded-lg bg-[#1a1a2e] border border-white/[0.06] flex items-center justify-center text-xs font-medium text-slate-500 hover:text-[#8b5cf6] hover:border-purple-500/30 transition-colors">
                {social[0]}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
