import { ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts';

export const chartTooltipStyle = {
  backgroundColor: '#1a1f2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px'
};

export const chartGridStyle = {
  strokeDasharray: '3 3' as const,
  stroke: 'rgba(255,255,255,0.1)'
};

export const axisStyle = {
  stroke: 'rgba(255,255,255,0.5)',
  fontSize: 12
};

interface ChartContainerProps {
  children: React.ReactNode;
  height?: string;
}

export function ChartContainer({ children, height = 'h-64' }: ChartContainerProps) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
