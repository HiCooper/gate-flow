import { Search, Bell, ExternalLink } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-14 border-b border-border-subtle bg-surface-0/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-text-muted" />
          <input
            type="text"
            placeholder="搜索付费墙、实验、模板..."
            className="w-full pl-9 pr-4 py-1.5 bg-white/[0.03] border border-border-subtle rounded-md text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 focus:bg-white/[0.05] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-400/10 text-amber-400 border border-amber-400/15">
          DEV
        </span>
        <button className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors">
          <Bell className="w-[18px] h-[18px]" />
        </button>
        <span className="w-px h-5 bg-border-subtle mx-1" />
        <a href="#" className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-colors">
          Docs
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
}
