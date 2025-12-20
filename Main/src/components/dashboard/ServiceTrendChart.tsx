'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ServiceTrendChartProps {
  data: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

export default function ServiceTrendChart({ data }: ServiceTrendChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value: any) => [
              value.toLocaleString('id-ID'), 
              'Jumlah'
            ]}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="orders" 
            name="Jumlah Servis" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="revenue" 
            name="Pendapatan (Rp)" 
            stroke="#82ca9d" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}