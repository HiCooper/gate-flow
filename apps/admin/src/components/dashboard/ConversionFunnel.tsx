import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ConversionStep } from '../../mocks/analytics';

interface ConversionFunnelProps {
  data: ConversionStep[];
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-border-subtle p-6">
      <h3 className="font-bold mb-6">转化漏斗</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#16181d',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                color: '#e4e4e7',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="value" fill="#2dd4bf" radius={[0, 4, 4, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
