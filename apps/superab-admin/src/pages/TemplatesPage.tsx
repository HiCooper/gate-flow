import { useEffect, useState } from 'react';
import { useTemplateStore } from '../stores/templateStore';
import { TemplateThumbnail } from '../components/shared/TemplateThumbnail';
import { Search, Star, TrendingUp } from 'lucide-react';

export function TemplatesPage() {
  const { templates, loading, fetchTemplates } = useTemplateStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const categories = ['全部', ...new Set(templates.map((t) => t.category))];

  const filtered = templates.filter((t) => {
    if (category !== '全部' && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">模板市场</h1>
        <p className="text-sm text-text-muted">浏览 {templates.length}+ 模板，快速开始构建付费墙。</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
          <input
            type="text"
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-3 border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              category === cat
                ? 'bg-accent-400/8 text-accent-400 border border-accent-400/15'
                : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03] border border-border-subtle'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="rounded-2xl bg-surface-2 border border-border-subtle p-4 hover:border-accent-400/20 hover:bg-surface-3 transition-all group cursor-pointer">
              <div className="aspect-video rounded-xl bg-surface-3 border border-border-subtle mb-4 overflow-hidden">
                <TemplateThumbnail category={tpl.category} variant={parseInt(tpl.id.split('-')[1], 10)} />
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate">{tpl.name}</h3>
              <p className="text-xs text-text-muted mb-3 truncate">{tpl.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {tpl.rating}
                </span>
                <span className="flex items-center gap-1 text-text-muted">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {tpl.usageCount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
