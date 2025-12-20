'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// Komponen untuk tren servis bulanan
export function ServiceTrendChart({ data }: { data: Array<{ month: string; orders: number; revenue: number }> }) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Jumlah Servis',
        data: data.map(d => d.orders),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Pendapatan (Rp)',
        data: data.map(d => d.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Jumlah Servis'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Pendapatan'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

// Komponen untuk tipe kendaraan
export function VehicleTypeChart({ data }: { data: Record<string, number> }) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Frekuensi Servis',
        data: Object.values(data),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

// Komponen untuk kategori servis
export function ServiceCategoryChart({ data }: { data: Record<string, number> }) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Pendapatan (Rp)',
        data: Object.values(data),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `Rp ${value.toLocaleString('id-ID')}`;
          }
        }
      }
    },
  };

  return <Pie data={chartData} options={options} />;
}

// Komponen untuk pelanggan teratas
export function TopCustomersChart({ data }: { data: Array<{ name: string; serviceCount: number; totalSpent: number }> }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Frekuensi Servis',
        data: data.map(d => d.serviceCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        yAxisID: 'y',
      },
      {
        label: 'Total Belanja (Rp)',
        data: data.map(d => d.totalSpent),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Jumlah Servis'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Total Belanja'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}