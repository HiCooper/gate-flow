import { clsx } from 'clsx';
import type { MetricResult } from '../types';

interface ReportTableProps {
  data: MetricResult[];
  title: string;
}

export function ReportTable({ data, title }: ReportTableProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">
                指标
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">
                Control
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">
                Treatment
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">
                提升
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">
                置信区间
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">
                p-value
              </th>
              <th className="px-4 py-2 text-center font-medium text-slate-500 dark:text-slate-400">
                显著性
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, index) => (
              <tr key={index} className="data-table-row transition-colors">
                <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                  {row.metricName}
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                  {row.control.mean.toFixed(4)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                  {row.treatment.mean.toFixed(4)}
                </td>
                <td
                  className={clsx(
                    'px-4 py-2 text-right font-mono font-medium',
                    row.lift > 0 ? 'text-green-600' : row.lift < 0 ? 'text-red-600' : 'text-slate-600'
                  )}
                >
                  {row.lift > 0 ? '+' : ''}
                  {(row.lift * 100).toFixed(2)}%
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-500 dark:text-slate-400">
                  [{row.liftLowerCI.toFixed(4)}, {row.liftUpperCI.toFixed(4)}]
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                  {row.pValue < 0.001 ? '<0.001' : row.pValue.toFixed(4)}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      row.isSignificant
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    )}
                  >
                    {row.isSignificant ? '显著' : '不显著'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
