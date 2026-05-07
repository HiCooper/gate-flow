import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Library, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export default function Layout({ children, showNav = true }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/books', icon: Library, label: '书库' },
    { path: '/subscribe', icon: BookOpen, label: '订阅' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold">ReadMore 读书</h1>
      </header>
      <main className="px-3 py-4">{children}</main>
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
