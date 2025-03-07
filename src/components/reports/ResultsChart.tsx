import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TestScore } from '@/lib/analysis';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsChartProps {
  testScores: TestScore[];
}

export function ResultsChart({ testScores }: ResultsChartProps) {
  const data = {
    labels: testScores.map(score => score.title),
    datasets: [
      {
        label: 'Score obtenu',
        data: testScores.map(score => score.totalScore),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Score maximum',
        data: testScores.map(score => score.maxScore),
        backgroundColor: 'rgba(209, 213, 219, 0.5)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Résultats par domaine',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...testScores.map(score => score.maxScore)),
      },
    },
  };

  return <Bar data={data} options={options} />;
}
