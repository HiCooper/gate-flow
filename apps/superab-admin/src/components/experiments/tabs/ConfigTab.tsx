import { Edit2, Save, X, Users, Plus, Trash2 } from 'lucide-react';
import type { ExperimentUI, VariantUI } from '../types';
import { metricLabel } from '../types';

interface EditFormVariant {
  id: string;
  name: string;
  bucketStart: number;
  bucketEnd: number;
  trafficPercentage: number;
  config: Record<string, any>;
}

interface ConfigTabProps {
  exp: ExperimentUI;
  variants: VariantUI[];
  isEditing: boolean;
  editForm: {
    name: string;
    hypothesis: string;
    variants: EditFormVariant[];
  };
  setEditForm: (form: any) => void;
  setIsEditing: (editing: boolean) => void;
  handleSaveConfig: () => Promise<void>;
  updateVariant: (variantId: string, field: string, value: any) => void;
  addVariant: () => void;
  removeVariant: (variantId: string) => void;
  saveLoading: boolean;
}

export function ConfigTab({
  exp,
  variants,
  isEditing,
  editForm,
  setEditForm,
  setIsEditing,
  handleSaveConfig,
  updateVariant,
  addVariant,
  removeVariant,
  saveLoading,
}: ConfigTabProps) {
  return (
    <div className="space-y-6">
      {/* Configuration Summary */}
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">基础配置</h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-400/10 text-accent-400 text-sm font-medium hover:bg-accent-400/20 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              编辑配置
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">实验名称</label>
              <input 
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-subtle text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">实验假设</label>
              <textarea 
                value={editForm.hypothesis}
                onChange={(e) => setEditForm({...editForm, hypothesis: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border-subtle text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveConfig}
                disabled={saveLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-400 text-surface-0 text-sm font-semibold hover:bg-accent-300 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? '保存中...' : '保存'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border-subtle text-text-primary text-sm font-medium hover:bg-surface-3 transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-text-muted mb-1">实验假设</div>
              <div className="text-sm text-text-primary">{exp.hypothesis}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">目标付费墙</div>
              <div className="text-sm text-text-primary">{exp.paywallName}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">主要指标</div>
              <div className="text-sm text-text-primary">{metricLabel[exp.primaryMetric] || exp.primaryMetric}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">流量分配</div>
              <div className="text-sm text-text-primary">{exp.trafficAllocation}% 用户</div>
            </div>
          </div>
        )}
        
        {!isEditing && exp.targetingRules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <div className="text-xs text-text-muted mb-2">受众定向</div>
            <div className="flex flex-wrap gap-2">
              {exp.targetingRules.map((rule, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-surface-3 text-xs text-text-secondary">
                  {rule.attribute} {rule.operator} {String(rule.value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Variants Configuration */}
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">变体配置</h3>
          {isEditing && (
            <button
              onClick={addVariant}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-400/10 text-accent-400 text-sm font-medium hover:bg-accent-400/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              新增变体
            </button>
          )}
        </div>
        
        {variants.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">暂无变体配置</p>
            {isEditing && (
              <button
                onClick={addVariant}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-400 text-surface-0 text-sm font-semibold hover:bg-accent-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                创建第一个变体
              </button>
            )}
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            {editForm.variants.map((variant, idx) => (
              <div key={variant.id} className="p-4 rounded-xl bg-surface-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{idx === 0 ? '对照组' : `实验组 ${idx}`}</span>
                  {idx > 0 && editForm.variants.length > 2 && (
                    <button
                      onClick={() => removeVariant(variant.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">分桶名称</label>
                    <input 
                      type="text"
                      value={variant.name || ''}
                      onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">流量比例 (%)</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={variant.trafficPercentage ?? 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          updateVariant(variant.id, 'trafficPercentage', value);
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (isNaN(value) || value < 0) {
                          updateVariant(variant.id, 'trafficPercentage', 0);
                        } else if (value > 100) {
                          updateVariant(variant.id, 'trafficPercentage', 100);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">配置参数</label>
                    <textarea 
                      value={JSON.stringify(variant.config || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          updateVariant(variant.id, 'config', JSON.parse(e.target.value));
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-xs font-mono"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className={`rounded-2xl border p-6 ${
                  exp.results.winner === variant.id
                    ? 'border-emerald-400/20 bg-emerald-400/[0.03]'
                    : 'border-border-subtle bg-surface-3'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{variant.name}</h3>
                    {variant.isControl && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-2 text-xs text-text-muted">对照组</span>
                    )}
                  </div>
                  {exp.results.winner === variant.id && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/8 text-emerald-400 text-xs font-medium border border-emerald-400/15">
                      获胜变体
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-surface-2">
                    <div className="text-lg font-extrabold">{variant.conversionRate}%</div>
                    <div className="text-[10px] text-text-muted mt-0.5">转化率</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface-2">
                    <div className="text-lg font-extrabold">{variant.impressions.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">展示</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface-2">
                    <div className="text-lg font-extrabold">{variant.trafficPercentage}%</div>
                    <div className="text-[10px] text-text-muted mt-0.5">流量</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
