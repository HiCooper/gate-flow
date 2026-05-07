import { Link, useLocation } from 'react-router-dom';
import { cn } from '@gate-flow/shared';
import { docSidebar } from '../../data/docs';
import { ChevronRight, BookOpen } from 'lucide-react';

export function DocsSidebar() {
  const location = useLocation();
  const currentSlug = location.pathname.replace('/docs/', '');

  return (
    <aside className="w-60 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <Link to="/docs" className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-purple-400 transition-colors">
          <BookOpen className="w-4 h-4" />
          文档首页
        </Link>
        <nav className="space-y-6">
          {docSidebar.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentSlug === item.slug || (!currentSlug && item.slug === 'getting-started');
                  return (
                    <li key={item.slug}>
                      <Link
                        to={`/docs/${item.slug}`}
                        className={cn(
                          'flex items-center gap-1.5 text-sm py-1.5 px-2 -mx-2 rounded-lg transition-colors',
                          isActive
                            ? 'text-purple-400 bg-purple-500/10 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <ChevronRight className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'opacity-100' : 'opacity-0')} />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
