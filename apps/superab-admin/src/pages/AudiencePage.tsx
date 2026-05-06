import { useEffect, useState } from 'react';
import { useAudienceStore } from '../stores/audienceStore';
import { Users, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

export function AudiencePage() {
  const { segments, attributes, loading, fetchSegments, fetchAttributes, deleteSegment } = useAudienceStore();
  const [tab, setTab] = useState<'segments' | 'attributes'>('segments');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSegments();
    fetchAttributes();
  }, [fetchSegments, fetchAttributes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">受众</h1>
          <p className="text-sm text-text-muted">管理用户分群和追踪属性。</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 hover:-translate-y-px transition-all">
          <Plus className="w-4 h-4" />
          新建分群
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('segments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'segments' ? 'bg-accent-400/8 text-accent-400' : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'
          }`}
        >
          分群（{segments.length}）
        </button>
        <button
          onClick={() => setTab('attributes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'attributes' ? 'bg-accent-400/8 text-accent-400' : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'
          }`}
        >
          属性（{attributes.length}）
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : tab === 'segments' ? (
        /* Segments */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div key={seg.id} className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-400/8 border border-accent-400/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-400" />
                </div>
                <button
                  onClick={() => setDeleteId(seg.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-bold mb-1">{seg.name}</h3>
              <p className="text-xs text-text-muted mb-4">{seg.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-text-secondary">预估 {seg.estimatedSize.toLocaleString()} 人</span>
                <span className="text-text-disabled">{seg.activePaywalls} 个付费墙</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {seg.rules.slice(0, 3).map((rule) => (
                  <span key={rule.id} className="px-2 py-0.5 rounded-md bg-surface-3 border border-border-subtle text-[10px] text-text-muted">
                    {rule.attribute} {rule.operator} {String(rule.value)}
                  </span>
                ))}
                {seg.rules.length > 3 && (
                  <span className="text-[10px] text-text-disabled">+{seg.rules.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Attributes */
        <div className="rounded-2xl bg-surface-2 border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">属性名</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">类型</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">分类</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">描述</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.id} className="border-b border-border-subtle hover:bg-white/[0.02]">
                  <td className="px-6 py-3 text-sm font-mono text-text-primary">{attr.name}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-surface-3 text-xs text-text-secondary">{attr.type}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-muted hidden sm:table-cell">{attr.category}</td>
                  <td className="px-6 py-3 text-sm text-text-muted hidden md:table-cell">{attr.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="删除分群"
        message="确定要删除这个受众分群吗？"
        onConfirm={() => {
          if (deleteId) {
            deleteSegment(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
