import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { Variant as ApiVariant } from '../../../api/experimentApi';

interface HistoryTabProps {
  expId: number;
}

export function HistoryTab({ expId }: HistoryTabProps) {
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [versionDetail, setVersionDetail] = useState<ApiVariant[] | null>(null);

  useEffect(() => {
    const fetchVersionHistory = async () => {
      try {
        const response = await fetch(`/api/v1/experiments/${expId}/versions`);
        if (response.ok) {
          const data = await response.json();
          setVersions(data);
        }
      } catch (error) {
        console.error('Failed to fetch version history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersionHistory();
  }, [expId]);

  const handleVersionClick = async (version: string) => {
    if (selectedVersion === version) {
      setSelectedVersion(null);
      setVersionDetail(null);
      return;
    }

    try {
      const response = await fetch(`/api/v1/experiments/${expId}/versions/${version}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedVersion(version);
        setVersionDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch version detail:', error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4">变更记录</h3>
        <div className="text-center py-8 text-text-muted">
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4">变更记录</h3>
        <div className="text-center py-12 text-text-muted">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无版本记录</p>
          <p className="text-xs mt-1">修改实验配置后将自动创建新版本</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4">版本历史</h3>
        <div className="space-y-2">
          {versions.map((version, index) => (
            <button
              key={version}
              onClick={() => handleVersionClick(version)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                selectedVersion === version
                  ? 'bg-accent-400/10 border-accent-400/30 text-accent-400'
                  : 'bg-surface-1 border-border-subtle hover:border-accent-400/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === 0 ? 'bg-accent-400/20 text-accent-400' : 'bg-surface-3 text-text-muted'
                  }`}>
                    v{versions.length - index}
                  </div>
                  <div>
                    <div className="font-medium">{version}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(version.replace(
                        /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                        '$1-$2-$3T$4:$5:$6'
                      )).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    当前版本
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {versionDetail && selectedVersion && (
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <h3 className="font-bold mb-4">版本配置详情 - {selectedVersion}</h3>
          <div className="space-y-3">
            {versionDetail.map((variant) => (
              <div
                key={variant.id}
                className="p-4 rounded-lg bg-surface-1 border border-border-subtle"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{variant.name || variant.variantKey}</div>
                  {variant.isActive && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                      活跃
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-text-muted text-xs">流量范围</div>
                    <div className="font-medium">{variant.bucketStart ?? 0} - {variant.bucketEnd ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs">流量比例</div>
                    <div className="font-medium">
                      {variant.bucketEnd && variant.bucketStart
                        ? `${((variant.bucketEnd - variant.bucketStart) / 100).toFixed(1)}%`
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs">参数值</div>
                    <div className="font-medium">{variant.params || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
