import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { formatCurrency } from '../utils/mortgageCalculations';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Chart component with its own lifecycle
const LoanStructureChart = ({ data }) => {
  return (
    <Pie
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Don't use ChartJS legend - we'll create our own below
          }
        }
      }}
    />
  );
};

const ResultsDisplay = ({ results }) => {
  const [showChart, setShowChart] = useState(false);

  // Effect to properly handle chart mounting/unmounting
  useEffect(() => {
    // When results change, we first hide the chart
    setShowChart(false);
    
    // Then show it again after a short delay to ensure proper cleanup
    const timer = setTimeout(() => {
      if (results) {
        setShowChart(true);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [results]);

  if (!results) return <div>Enter your mortgage details to see results</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-black dark:text-white">Mortgage Summary</h2>

      {/* Basic metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-500 dark:text-gray-100">Loan Amount</p>
          <p className="text-lg font-semibold dark:text-white">{formatCurrency(results.loanAmount)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-500 dark:text-gray-100">Down Payment</p>
          <p className="text-lg font-semibold dark:text-white">{formatCurrency(results.downPayment)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-500 dark:text-gray-100">Monthly Payment</p>
          <p className="text-lg font-semibold dark:text-white">{formatCurrency(results.monthlyPayment)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-500 dark:text-gray-100">Total Payment</p>
          <p className="text-lg font-semibold dark:text-white">{formatCurrency(results.totalPayment)}</p>
        </div>
      </div>

      {/* More details */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-100">Loan Term</span>
          <span className="font-medium dark:text-white">{results.loanTerm} years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-100">Interest Rate</span>
          <span className="font-medium dark:text-white">{results.interestRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-100">Loan to Value Ratio</span>
          <span className="font-medium dark:text-white">{results.loanToValue.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-100">Total Interest Paid</span>
          <span className="font-medium dark:text-white">{formatCurrency(results.totalInterest)}</span>
        </div>
      </div>

      {/* Pie Chart - Loan Structure */}
      <div className="mt-6">
        <h3 className="text-md font-medium mb-2 text-black dark:text-white">Loan Structure</h3>
        <div className="w-full" style={{ maxHeight: '250px' }}>
          {showChart && results.chartData && (
            <LoanStructureChart 
              key={`chart-${Date.now()}`} /* Ensures unique key every render */
              data={results.chartData} 
            />
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-indigo-600 inline-block mr-2 rounded-sm"></span>
            <span className="text-black dark:text-white">Principal: {formatCurrency(results.loanAmount)}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-amber-500 inline-block mr-2 rounded-sm"></span>
            <span className="text-black dark:text-white">Interest: {formatCurrency(results.totalInterest)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;