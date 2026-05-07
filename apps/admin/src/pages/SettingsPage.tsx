import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { Save, Globe, Link, Key } from 'lucide-react';

export function SettingsPage() {
  const { settings, loading, fetchSettings, updateSettings } = useSettingsStore();
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setName(settings.brand.name);
      setPrimaryColor(settings.brand.primaryColor);
      setAccentColor(settings.brand.accentColor);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      brand: { name, logo: '', primaryColor, accentColor },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">设置</h1>
        <p className="text-sm text-text-muted">管理品牌、环境和 Webhook 配置。</p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Brand */}
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent-400" />
            品牌设置
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">品牌名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-400/30 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">主题色</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface-3 border border-border-subtle rounded-lg text-xs font-mono text-text-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">强调色</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface-3 border border-border-subtle rounded-lg text-xs font-mono text-text-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            环境配置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">环境模式</div>
                <div className="text-xs text-text-muted">当前 SDK 运行环境</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-amber-400/8 text-amber-400 text-xs font-semibold border border-amber-400/15 uppercase">
                {settings.environment.mode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">SDK 版本</div>
                <div className="text-xs text-text-muted">当前集成 SDK 版本</div>
              </div>
              <span className="text-sm text-text-secondary">{settings.environment.sdkVersion}</span>
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Link className="w-4 h-4 text-accent-400" />
            Webhooks
          </h3>
          <div className="space-y-3">
            {settings.webhooks.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-3 border border-border-subtle">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono truncate">{wh.url}</div>
                  <div className="flex gap-1.5 mt-1.5">
                    {wh.events.map((e) => (
                      <span key={e} className="px-2 py-0.5 rounded-md bg-surface-4 text-[10px] text-text-muted">{e}</span>
                    ))}
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ml-4 shrink-0 ${
                  wh.active ? 'bg-emerald-400/8 text-emerald-400 border-emerald-400/15' : 'bg-slate-500/10 text-text-muted border-slate-500/20'
                }`}>
                  {wh.active ? '活跃' : '停用'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 transition-all"
          >
            <Save className="w-4 h-4" />
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
