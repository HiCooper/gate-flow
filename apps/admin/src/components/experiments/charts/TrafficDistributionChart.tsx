// @ts-ignore - recharts types issue, works at runtime
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, chartTooltipStyle, chartGridStyle, axisStyle } from './BaseChart';

interface TrafficTimeSeries {
  time: string;
  control: number;
  treatment: number;
}

interface TrafficDistribution {
  name: string;
  expected: number;
  actual: number;
  users: number;
}

interface TrafficDistributionChartProps {
  timeSeries: TrafficTimeSeries[];
  distribution: TrafficDistribution[];
}

export function TrafficDistributionChart({ timeSeries, distribution }: TrafficDistributionChartProps) {
  return (
    <div className="space-y-6">
      {/* 实时流量监控 */}
      <div>
        <h4 className="font-medium mb-3">流量分布趋势</h4>
        <ChartContainer>
          <LineChart data={timeSeries}>
            <CartesianGrid {...chartGridStyle} />
            <XAxis dataKey="time" {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="control" 
              stroke="#6366f1" 
              strokeWidth={2} 
              name="对照组%" 
            />
            <Line 
              type="monotone" 
              dataKey="treatment" 
              stroke="#10b981" 
              strokeWidth={2} 
              name="实验组%" 
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* 分桶流量对比 */}
      <div>
        <h4 className="font-medium mb-3">分桶流量对比</h4>
        <ChartContainer>
          <BarChart data={distribution}>
            <CartesianGrid {...chartGridStyle} />
            <XAxis dataKey="name" {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Bar dataKey="expected" fill="#6366f1" name="预期比例%" />
            <Bar dataKey="actual" fill="#10b981" name="实际比例%" />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
