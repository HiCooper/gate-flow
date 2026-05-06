import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaywallStore } from '../../../stores/paywallStore';
import { useExperimentStore } from '../../../stores/experimentStore';
import { X, ChevronDown, Check } from 'lucide-react';
import type { PrimaryMetric } from '../types';

interface CreateExperimentModalProps {
  open: boolean;
  onClose: () => void;
}

const metricOptions: { value: PrimaryMetric; label: string; desc: string }[] = [
  { value: 'conversion_rate', label: '转化率', desc: '用户完成订阅的比例' },
  { value: 'revenue', label: '收入', desc: '总收入金额' },
  { value: 'trial_start', label: '试用开始', desc: '用户开始试用的人数' },
  { value: 'retention_d7', label: '7日留存', desc: '用户7天后仍活跃的比例' },
];

export function CreateExperimentModal({ open, onClose }: CreateExperimentModalProps) {
  const navigate = useNavigate();
  const { paywalls, fetchPaywalls } = usePaywallStore();
  const { createExperiment } = useExperimentStore();

  const [name, setName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [paywallId, setPaywallId] = useState('');
  const [primaryMetric, setPrimaryMetric] = useState<PrimaryMetric>('conversion_rate');
  const [trafficAllocation, setTrafficAllocation] = useState(50);
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch paywalls on mount if not loaded
  useState(() => {
    if (paywalls.length === 0) fetchPaywalls();
  });

  const handleSubmit = async () => {
    if (!name.trim() || !paywallId) return;

    setSaving(true);
    const paywall = paywalls.find((p) => p.id === paywallId);
    const experiment = await createExperiment({
      name,
      hypothesis,
      paywallId,
      paywallName: paywall?.name || '未知付费墙',
      primaryMetric,
      trafficAllocation,
    });

    setSaving(false);
    onClose();
    navigate(`/experiments/${experiment.id}`);
  };

  if (!open) return null;

  const selectedMetric = metricOptions.find((m) => m.value === primaryMetric);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-2 border border-border-subtle rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="text-lg font-bold">新建实验</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">实验名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：定价对比测试 ¥38 vs ¥48"
              className="w-full px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors"
            />
          </div>

          {/* Hypothesis */}
          <div>
            <label className="block text-sm font-medium mb-2">实验假设</label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="描述你希望通过实验验证什么..."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-400/30 transition-colors resize-none"
            />
          </div>

          {/* Paywall */}
          <div>
            <label className="block text-sm font-medium mb-2">目标付费墙</label>
            <select
              value={paywallId}
              onChange={(e) => setPaywallId(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-400/30 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>选择付费墙...</option>
              {paywalls.map((pw) => (
                <option key={pw.id} value={pw.id}>{pw.name}</option>
              ))}
            </select>
          </div>

          {/* Primary Metric */}
          <div>
            <label className="block text-sm font-medium mb-2">主要指标</label>
            <div className="relative">
              <button
                onClick={() => setMetricDropdownOpen(!metricDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-3 border border-border-subtle rounded-xl text-sm text-text-primary hover:border-border-default transition-colors"
              >
                <div>
                  <span className="font-medium">{selectedMetric?.label}</span>
                  <span className="text-text-muted ml-2">{selectedMetric?.desc}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>

              {metricDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-surface-3 border border-border-subtle rounded-xl shadow-xl z-10 overflow-hidden">
                  {metricOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setPrimaryMetric(opt.value);
                        setMetricDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/[0.05] transition-colors ${
                        primaryMetric === opt.value ? 'bg-accent-400/4' : ''
                      }`}
                    >
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-text-muted ml-2">{opt.desc}</span>
                      </div>
                      {primaryMetric === opt.value && (
                        <Check className="w-4 h-4 text-accent-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Traffic Allocation */}
          <div>
            <label className="block text-sm font-medium mb-2">流量分配</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={trafficAllocation}
                onChange={(e) => setTrafficAllocation(Number(e.target.value))}
                className="flex-1 h-2 bg-surface-3 rounded-full appearance-none cursor-pointer accent-accent-400"
              />
              <span className="text-sm font-medium text-text-primary w-12 text-right">{trafficAllocation}%</span>
            </div>
            <p className="text-xs text-text-muted mt-1">分配给此实验的用户比例</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !paywallId || saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-400 text-surface-0 rounded-xl text-sm font-semibold hover:bg-accent-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '创建中...' : '创建实验'}
          </button>
        </div>
      </div>
    </div>
  );
}