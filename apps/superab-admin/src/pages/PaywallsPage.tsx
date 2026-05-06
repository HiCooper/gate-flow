import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaywallStore } from '../stores/paywallStore';
import { StatusBadge } from '../components/shared/StatusBadge';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import type { PaywallStatus } from '../mocks/paywalls';

export function PaywallsPage() {
  const navigate = useNavigate();
  const { paywalls, loading, fetchPaywalls, deletePaywall } = usePaywallStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaywallStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchPaywalls();
  }, [fetchPaywalls]);

  const filtered = paywalls.filter((pw) => {
    if (statusFilter !== 'all' && pw.status !== statusFilter) return false;
    if (search && !pw.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statuses: (PaywallStatus | 'all')[] = ['all', 'active', 'draft', 'paused', 'archived'];
  const statusLabels: Record<string, string> = { all: '全部', active: '已上线', draft: '草稿', paused: '已暂停', archived: '已归档' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">付费墙</h1>
          <p className="text-sm text-text-muted">管理你的所有付费墙配置。</p>
        </div>
        <button
          onClick={() => navigate('/paywalls/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 hover:-translate-y-px transition-all"
        >
          <Plus className="w-4 h-4" />
          新建付费墙
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
          <input
            type="text"
            placeholder="搜索付费墙..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-3 border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-accent-400/8 text-accent-400 border border-accent-400/15'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="rounded-2xl bg-surface-2 border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">名称</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">状态</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">平台</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">展示</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">转化</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">收入</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((pw) => (
                  <tr key={pw.id} className="border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{pw.name}</div>
                      <div className="text-xs text-text-muted mt-0.5">{pw.template}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pw.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary hidden sm:table-cell">{pw.platform}</td>
                    <td className="px-6 py-4 text-sm text-right hidden md:table-cell">{pw.impressions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-right hidden md:table-cell">{pw.conversions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-right hidden lg:table-cell">¥{pw.revenue.toLocaleString()}</td>
                    <td className="px-4 py-4 relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === pw.id ? null : pw.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menuOpen === pw.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-surface-3 border border-border-default rounded-xl shadow-xl z-10 py-1">
                          <button onClick={() => { setMenuOpen(null); navigate(`/paywalls/${pw.id}`); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-white/[0.05]">
                            <Edit className="w-3.5 h-3.5" /> 编辑
                          </button>
                          <button onClick={() => { setMenuOpen(null); navigate(`/paywalls/${pw.id}?preview=1`); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-white/[0.05]">
                            <Eye className="w-3.5 h-3.5" /> 预览
                          </button>
                          <button onClick={() => { setMenuOpen(null); setDeleteId(pw.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/[0.05]">
                            <Trash2 className="w-3.5 h-3.5" /> 删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="删除付费墙"
        message="确定要删除这个付费墙吗？此操作不可撤销。"
        onConfirm={() => {
          if (deleteId) {
            deletePaywall(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
