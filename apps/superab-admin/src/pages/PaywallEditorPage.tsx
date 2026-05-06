import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaywallStore } from '../stores/paywallStore';
import { useTemplateStore } from '../stores/templateStore';
import { ArrowLeft, Save } from 'lucide-react';

export function PaywallEditorPage() {
  const navigate = useNavigate();
  const { createPaywall } = usePaywallStore();
  const { templates, fetchTemplates } = useTemplateStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'react-native' | 'web' | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saving, setSaving] = useState(false);

  useState(() => { fetchTemplates(); });

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createPaywall({
      name,
      description,
      platform,
      template: selectedTemplate || 'classic-3-tier',
    });
    navigate('/paywalls');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/paywalls')} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.03] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">新建付费墙</h1>
          <p className="text-sm text-text-muted">创建一个新的付费墙配置。</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入付费墙名称"
            className="w-full px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简要描述这个付费墙的用途"
            rows={3}
            className="w-full px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors resize-none"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium mb-2">目标平台</label>
          <div className="flex gap-2">
            {(['all', 'ios', 'android', 'react-native', 'web'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                  platform === p
                    ? 'bg-accent-400/8 text-accent-400 border border-accent-400/15'
                    : 'text-text-secondary border border-border-subtle hover:bg-white/[0.03]'
                }`}
              >
                {p === 'all' ? '全平台' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Template selection */}
        <div>
          <label className="block text-sm font-medium mb-2">模板</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {templates.slice(0, 12).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.name)}
                className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                  selectedTemplate === tpl.name
                    ? 'border-accent-400/30 bg-accent-400/4'
                    : 'border-border-subtle hover:bg-white/[0.03]'
                }`}
              >
                <div className="font-medium truncate">{tpl.name}</div>
                <div className="text-text-muted mt-0.5">{tpl.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={() => navigate('/paywalls')}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
