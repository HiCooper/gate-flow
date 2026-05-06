import { BarChart3 } from 'lucide-react';
import { ConversionBarChart } from '../charts/ConversionBarChart';
import { TrendLineChart } from '../charts/TrendLineChart';
import type { ExperimentUI, VariantUI, StatisticalResult } from '../types';

interface ReportTabProps {
  exp: ExperimentUI;
  variants: VariantUI[];
  stat?: StatisticalResult;
  hasResults: boolean;
}

export function ReportTab({ exp, variants, stat, hasResults }: ReportTabProps) {
  // 转化率对比数据
  const conversionData = variants.map((v) => ({
    name: v.name,
    conversionRate: v.conversionRate,
    impressions: v.impressions,
    conversions: v.conversions,
    isControl: v.isControl,
  }));

  // 时间趋势数据（Mock）
  const trendData = [
    { date: '05-01', control: 3.2, treatment: 3.5 },
    { date: '05-02', control: 3.3, treatment: 3.6 },
    { date: '05-03', control: 3.1, treatment: 3.7 },
    { date: '05-04', control: 3.4, treatment: 3.8 },
    { date: '05-05', control: 3.2, treatment: 3.9 },
    { date: '05-06', control: 3.3, treatment: 4.0 },
  ];

  if (!hasResults) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6 text-center">
        {exp.status === 'running' ? (
          <>
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-accent-400/50" />
            <div className="text-text-primary text-sm font-medium">实验正在运行中</div>
            <div className="text-text-muted text-xs mt-1">数据收集需要时间，请稍后查看统计结果</div>
          </>
        ) : (
          <div className="text-text-muted text-sm">实验尚未开始，暂无统计数据</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计结果摘要 */}
      {stat && stat.pValue !== undefined && (
        <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">统计结果</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              stat.pValue < 0.05 
                ? 'bg-emerald-400/10 text-emerald-400'
                : 'bg-amber-400/10 text-amber-400'
            }`}>
              {stat.pValue < 0.05 ? '✓ 统计显著' : '⚠ 未达显著'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 rounded-xl bg-surface-3">
              <div className="text-3xl font-extrabold text-text-primary">
                {stat.liftPercent !== undefined ? (stat.liftPercent > 0 ? '+' : '') + stat.liftPercent.toFixed(2) + '%' : 'N/A'}
              </div>
              <div className="text-xs text-text-muted mt-1">相对提升</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-surface-3">
              <div className="text-3xl font-extrabold text-text-primary">
                {stat.pValue < 0.001 ? '< 0.001' : stat.pValue.toFixed(3)}
              </div>
              <div className="text-xs text-text-muted mt-1">P 值</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-surface-3">
              <div className="text-3xl font-extrabold text-text-primary">
                {exp.results.confidence || 0}%
              </div>
              <div className="text-xs text-text-muted mt-1">置信度</div>
            </div>
          </div>
        </div>
      )}

      {/* 转化率对比柱状图 */}
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4">转化率对比</h3>
        <ConversionBarChart data={conversionData} />
      </div>

      {/* 时间趋势折线图 */}
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4">转化率时间趋势</h3>
        <TrendLineChart data={trendData} />
      </div>

      {/* 各变体详细数据 */}
      <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
        <h3 className="font-bold mb-4">各变体详细数据</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 px-4 text-text-muted font-medium">变体</th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">展示数</th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">转化数</th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">转化率</th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">流量占比</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-border-subtle/50">
                  <td className="py-3 px-4 font-medium">
                    {v.name}
                    {v.isControl && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-surface-3 text-xs text-text-muted">对照</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">{v.impressions.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{v.conversions.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 font-bold">{v.conversionRate}%</td>
                  <td className="text-right py-3 px-4">{v.trafficPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
