import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useExperimentStore } from '../stores/experimentStore';
import { ArrowLeft, Play, Pause, Square, Archive, Settings, Activity, FileText, History } from 'lucide-react';
import { experimentApi } from '../api/experimentApi';
import { ConfigTab } from '../components/experiments/tabs/ConfigTab';
import { DiagnosisTab } from '../components/experiments/tabs/DiagnosisTab';
import { ReportTab } from '../components/experiments/tabs/ReportTab';
import { HistoryTab } from '../components/experiments/tabs/HistoryTab';
import { statusLabel } from '../components/experiments/types';

type TabId = 'config' | 'diagnosis' | 'report' | 'history';

export function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { 
    experiments, 
    selectedExperiment,
    selectedVariants,
    fetchExperiments,
    fetchExperimentDetail,
    updateExperimentStatus,
    loading,
    error
  } = useExperimentStore();

  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('config');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    hypothesis: '',
    variants: [] as Array<{
      id: string;
      name: string;
      bucketStart: number;
      bucketEnd: number;
      trafficPercentage: number;
      config: Record<string, any>;
    }>,
  });

  useEffect(() => {
    if (id) fetchExperimentDetail(id);
    if (experiments.length === 0) fetchExperiments();
  }, [id, fetchExperimentDetail, fetchExperiments, experiments.length]);

  const exp = selectedExperiment || experiments.find((e) => e.id === id);
  const variants = selectedVariants || exp?.variants || [];

  useEffect(() => {
    if (exp) {
      setEditForm({
        name: exp.name,
        hypothesis: exp.hypothesis || '',
        variants: (selectedVariants || exp?.variants || []).map(v => ({
          id: v.id,
          name: v.name,
          bucketStart: (v as any).bucketStart || 0,
          bucketEnd: (v as any).bucketEnd || 0,
          trafficPercentage: v.trafficPercentage || 0,
          config: v.config,
        })),
      });
      setIsEditing(false);
    }
  }, [exp, selectedVariants]);

  if (!exp) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold mb-4">实验未找到</h1>
        <Link to="/experiments" className="inline-flex items-center gap-2 text-sm text-accent-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          返回实验列表
        </Link>
      </div>
    );
  }

  const handleSaveConfig = async () => {
    try {
      setSaveLoading(true);
      
      // 验证流量比例总和
      const totalPercentage = editForm.variants.reduce((sum, v) => sum + (v.trafficPercentage || 0), 0);
      if (totalPercentage !== 100) {
        alert(`流量比例总和为${totalPercentage}%，必须等于100%`);
        setSaveLoading(false);
        return;
      }
      
      // 前端只传流量比例，由后端计算bucket边界
      const variantsForSave = editForm.variants.map(v => ({
        variantKey: (v as any).variantKey || v.name.toLowerCase().replace(/\s+/g, '_'),
        name: v.name,
        trafficPercentage: v.trafficPercentage || 0,  // 后端根据此值计算bucketStart和bucketEnd
        params: JSON.stringify(v.config || {}),
      }));
      
      await experimentApi.update(parseInt(id!), {
        name: editForm.name,
        description: editForm.hypothesis,
        variants: variantsForSave,
      });
      
      setIsEditing(false);
      if (id) fetchExperimentDetail(id);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('保存失败: ' + error);
    } finally {
      setSaveLoading(false);
    }
  };

  const updateVariant = (variantId: string, field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      variants: prev.variants.map(v => 
        v.id === variantId ? { ...v, [field]: value } : v
      ),
    }));
  };

  const addVariant = () => {
    const newId = `new_${Date.now()}`;
    const newVariant = {
      id: newId,
      name: `实验组${editForm.variants.length}`,
      bucketStart: 0,
      bucketEnd: 0,
      trafficPercentage: 0,
      config: {},
    };
    setEditForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const removeVariant = (variantId: string) => {
    setEditForm(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/experiments" className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.03] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{exp.name}</h1>
            <p className="text-sm text-text-muted mt-1">
              {statusLabel[exp.status]} · 创建于 {exp.createdAt.slice(0, 10)}
            </p>
          </div>
        </div>

        {/* Lifecycle Controls */}
        <div className="flex gap-2">
          {(exp.status === 'draft' || exp.status === 'review') && (
            <button 
              onClick={() => updateExperimentStatus(exp.id, 'running')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-400 text-surface-0 text-sm font-semibold hover:bg-accent-300 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {loading ? '启动中...' : '开始实验'}
            </button>
          )}
          {(exp.status === 'running' || exp.status === 'ramp') && (
            <button 
              onClick={() => updateExperimentStatus(exp.id, 'paused')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border-subtle text-text-primary text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              {loading ? '暂停中...' : '暂停'}
            </button>
          )}
          {exp.status === 'paused' && (
            <>
              <button 
                onClick={() => updateExperimentStatus(exp.id, 'running')}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-400 text-surface-0 text-sm font-semibold hover:bg-accent-300 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading ? '继续中...' : '继续'}
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border-subtle text-text-primary text-sm font-medium hover:bg-surface-3 transition-colors">
                <Square className="w-4 h-4" />
                停止
              </button>
            </>
          )}
          {(exp.status === 'analyzing' || exp.status === 'decision' || exp.status === 'archive') && exp.results.totalImpressions > 0 && exp.results.winner && (
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400/8 border border-emerald-400/15 text-emerald-400 text-sm font-medium hover:bg-emerald-400/15 transition-colors">
              <Archive className="w-4 h-4" />
              推广获胜变体
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border-subtle">
        <nav className="flex gap-6">
          {[
            { id: 'config' as const, label: '实验配置', icon: Settings },
            { id: 'diagnosis' as const, label: '分流诊断', icon: Activity },
            { id: 'report' as const, label: '实验报告', icon: FileText },
            { id: 'history' as const, label: '变更记录', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-accent-400 text-accent-400 font-medium' 
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <ConfigTab
          exp={exp}
          variants={variants}
          isEditing={isEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          setIsEditing={setIsEditing}
          handleSaveConfig={handleSaveConfig}
          updateVariant={updateVariant}
          addVariant={addVariant}
          removeVariant={removeVariant}
          saveLoading={saveLoading}
        />
      )}

      {activeTab === 'diagnosis' && (
        <DiagnosisTab expId={parseInt(id!, 10)} variants={variants} />
      )}

      {activeTab === 'report' && (
        <ReportTab 
          exp={exp}
          variants={variants}
          stat={exp.results.statistical}
          hasResults={exp.results.totalImpressions > 0}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab expId={parseInt(id!, 10)} />
      )}
    </div>
  );
}
