import { useEffect, useState } from 'react';
import { Activity, CheckCircle, BarChart3 } from 'lucide-react';
import { TrafficDistributionChart } from '../charts/TrafficDistributionChart';
import type { VariantUI } from '../types';

interface DiagnosisData {
  trafficDistribution: Array<{
    name: string;
    expected: number;
    actual: number;
    users: number;
  }>;
  srmTest: {
    pValue: number;
    passed: boolean;
    chiSquare: number;
  };
  aaValidation: {
    falsePositiveRate: number;
    platformBias: 'low' | 'medium' | 'high';
    historicalTests: number;
    lastTestDate: string;
  };
  timeSeries: Array<{
    time: string;
    control: number;
    treatment: number;
  }>;
}

interface DiagnosisTabProps {
  expId: number;
  variants: VariantUI[];
}

export function DiagnosisTab({ expId, variants }: DiagnosisTabProps) {
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 调用真实API - diagnosisApi.getDiagnosisData(expId)
    // Mock数据
    setDiagnosisData({
      trafficDistribution: variants.map((v) => ({
        name: v.name,
        expected: v.trafficPercentage,
        actual: v.trafficPercentage + (Math.random() - 0.5) * 2,
        users: Math.floor((v.impressions || 10000) * 0.3),
      })),
      srmTest: {
        pValue: 0.85,
        passed: true,
        chiSquare: 0.03,
      },
      aaValidation: {
        falsePositiveRate: 4.8,
        platformBias: 'low',
        historicalTests: 23,
        lastTestDate: '2026-05-05',
      },
      timeSeries: [
        { time: '10:00', control: 48.5, treatment: 51.5 },
        { time: '11:00', control: 49.2, treatment: 50.8 },
        { time: '12:00', control: 50.1, treatment: 49.9 },
        { time: '13:00', control: 49.8, treatment: 50.2 },
        { time: '14:00', control: 50.3, treatment: 49.7 },
      ]
    });
    setLoading(false);
  }, [variants]);

  if (loading) {
    return <div className="text-center py-12 text-text-muted">加载中...</div>;
  }

  if (!diagnosisData) {
    return <div className="text-center py-12 text-text-muted">暂无诊断数据</div>;
  }

  return (
    <div className="space-y-6">
      {/* 实时流量监控 */}
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-400" />
          实时流量分布趋势
        </h3>
        <TrafficDistributionChart 
          timeSeries={diagnosisData.timeSeries}
          distribution={diagnosisData.trafficDistribution}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* SRM 检验结果 */}
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            SRM 样本比例检验
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">卡方值</span>
              <span className="text-lg font-bold text-text-primary">{diagnosisData.srmTest.chiSquare.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">P 值</span>
              <span className="text-lg font-bold text-text-primary">{diagnosisData.srmTest.pValue.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">检验结果</span>
              {diagnosisData.srmTest.passed ? (
                <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-medium">
                  ✓ 通过
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-red-400/10 text-red-400 text-sm font-medium">
                  ✗ 未通过
                </span>
              )}
            </div>
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-xs text-text-muted">
                {diagnosisData.srmTest.passed 
                  ? '流量分配符合预期比例，样本比例正常' 
                  : '流量分配比例异常，可能影响实验结果可靠性'}
              </p>
            </div>
          </div>
        </div>

        {/* AA 验证结果 */}
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent-400" />
            AA 回溯验证
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">假阳性率</span>
              <span className="text-lg font-bold text-text-primary">{diagnosisData.aaValidation.falsePositiveRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">平台偏差</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                diagnosisData.aaValidation.platformBias === 'low' 
                  ? 'bg-emerald-400/10 text-emerald-400'
                  : diagnosisData.aaValidation.platformBias === 'medium'
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'bg-red-400/10 text-red-400'
              }`}>
                {diagnosisData.aaValidation.platformBias === 'low' ? '低偏差' : diagnosisData.aaValidation.platformBias === 'medium' ? '中等偏差' : '高偏差'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">历史测试次数</span>
              <span className="text-lg font-bold text-text-primary">{diagnosisData.aaValidation.historicalTests}</span>
            </div>
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-xs text-text-muted">
                上次测试: {diagnosisData.aaValidation.lastTestDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
