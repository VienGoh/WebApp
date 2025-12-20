'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopCustomersChartProps {
  data: Array<{
    name: string;
    serviceCount: number;
    totalSpent: number;
  }>;
}

export default function TopCustomersChart({ data }: TopCustomersChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === 'totalSpent') {
                return [new Intl.NumberFormat('id-ID').format(Number(value)), 'Total Belanja (Rp)'];
              }
              return [value, 'Jumlah Servis'];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="serviceCount" name="Frekuensi Servis" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="totalSpent" name="Total Belanja" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}