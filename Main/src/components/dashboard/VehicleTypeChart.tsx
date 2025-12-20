'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VehicleTypeChartProps {
  data: Record<string, number>;
}

export default function VehicleTypeChart({ data }: VehicleTypeChartProps) {
  const chartData = Object.entries(data).map(([type, count]) => ({
    type,
    count
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip formatter={(value: any) => [value, 'Jumlah Servis']} />
          <Legend />
          <Bar dataKey="count" name="Frekuensi Servis" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}