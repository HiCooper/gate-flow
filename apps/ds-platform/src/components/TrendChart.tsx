import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyMetrics } from '../types';

interface TrendChartProps {
  data: DailyMetrics[];
  dataKey: keyof DailyMetrics;
  variants: string[];
  colors?: string[];
  height?: number;
  formatValue?: (value: number) => string;
}

const DEFAULT_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export function TrendChart({
  data,
  dataKey,
  variants,
  colors = DEFAULT_COLORS,
  height = 300,
  formatValue,
}: TrendChartProps) {
  // Group by date and variant
  const groupedData: Record<string, Record<string, number | string>> = {};
  data.forEach((d) => {
    if (!groupedData[d.date]) {
      groupedData[d.date] = { date: d.date };
    }
    groupedData[d.date][d.variantKey] = d[dataKey] as number;
  });

  const finalData = Object.values(groupedData);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={finalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#94A3B8' }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#94A3B8' }}
          tickFormatter={formatValue}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [formatValue ? formatValue(value) : value.toFixed(2)]}
        />
        <Legend />
        {variants.map((variant, index) => (
          <Line
            key={variant}
            type="monotone"
            dataKey={variant}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
