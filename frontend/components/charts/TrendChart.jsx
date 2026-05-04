'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function TrendChart({ labels = [], values = [], label = 'Trend' }) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: '#0078D4',
            backgroundColor: 'rgba(0,120,212,0.2)',
            fill: true,
            tension: 0.25
          }
        ]
      }}
      options={{ responsive: true, maintainAspectRatio: false }}
      height={110}
    />
  );
}
