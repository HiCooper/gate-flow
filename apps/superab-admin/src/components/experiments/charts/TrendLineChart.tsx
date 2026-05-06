// @ts-ignore - recharts types issue, works at runtime
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, chartTooltipStyle, chartGridStyle, axisStyle } from './BaseChart';

interface TrendData {
  date: string;
  control: number;
  treatment: number;
}

interface TrendLineChartProps {
  data: TrendData[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  return (
    <ChartContainer>
      <LineChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="date" {...axisStyle} />
        <YAxis {...axisStyle} domain={['auto', 'auto']} />
        <Tooltip 
          contentStyle={chartTooltipStyle} 
          formatter={(value: number) => `${value}%`} 
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="control" 
          stroke="#6366f1" 
          strokeWidth={2} 
          name="对照组" 
        />
        <Line 
          type="monotone" 
          dataKey="treatment" 
          stroke="#10b981" 
          strokeWidth={2} 
          name="实验组" 
        />
      </LineChart>
    </ChartContainer>
  );
}
