import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Button } from '@gate-flow/shared';

const navLinks = [
  { label: '功能', href: '/#features' },
  { label: '定价', href: '/pricing' },
  { label: '文档', href: '/docs' },
  { label: '博客', href: '/blog' },
  { label: '案例', href: '/customers' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
    }`}>
      <Container className="flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] rounded-lg flex items-center justify-center">
            <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
          </div>
          GateFlow
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">登录</Button>
          <Button variant="primary" size="sm">免费开始</Button>
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
      </Container>
      
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#0a0a0f] px-6 py-4 flex flex-col gap-3">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} className="text-sm text-slate-400 hover:text-white py-1">{link.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
