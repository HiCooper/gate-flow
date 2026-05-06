// @ts-ignore - recharts types issue, works at runtime
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, chartTooltipStyle, chartGridStyle, axisStyle } from './BaseChart';

interface ConversionData {
  name: string;
  conversionRate: number;
  impressions: number;
  conversions: number;
  isControl: boolean;
}

interface ConversionBarChartProps {
  data: ConversionData[];
}

export function ConversionBarChart({ data }: ConversionBarChartProps) {
  return (
    <ChartContainer>
      <BarChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="name" {...axisStyle} />
        <YAxis {...axisStyle} />
        <Tooltip 
          contentStyle={chartTooltipStyle} 
          formatter={(value: number) => `${value}%`} 
        />
        <Legend />
        <Bar 
          dataKey="conversionRate" 
          fill="#6366f1" 
          name="转化率%" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ChartContainer>
  );
}
