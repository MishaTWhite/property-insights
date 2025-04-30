import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface LoanChartProps {
  loanAmount: number;
  totalInterest: number;
}

const LoanChart: React.FC<LoanChartProps> = ({ loanAmount, totalInterest }) => {
  const data = {
    labels: ['Principal', 'Interest'],
    datasets: [
      {
        data: [loanAmount, totalInterest],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)', // Indigo for principal
          'rgba(244, 114, 182, 0.8)', // Pink for interest
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(244, 114, 182, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 14,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}% (${value.toLocaleString()} units)`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Loan Structure</h3>
      <div className="h-64">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default LoanChart;