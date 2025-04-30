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

  if (!results) return <div>Enter your mortgage details to see results</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>Calculation Results</h2>

      {/* Loan Summary */}
      <div className="p-4 rounded border" style={{ backgroundColor: '#f2f4f6', borderColor: '#dee2e6' }}>
        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Loan Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-label">Loan Amount:</span>
            <span className="text-value">{formatCurrency(results.loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-label">Monthly Payment:</span>
            <span className="text-value font-bold" style={{ color: 'var(--color-accent)' }}>{formatCurrency(results.monthlyPayment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-label">Duration:</span>
            <span className="text-value">{results.loanTerm} years ({results.loanTerm * 12} payments)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-label">Interest Rate:</span>
            <span className="text-value">{results.interestRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Total Cost of Loan */}
      <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-white)', borderColor: '#dee2e6' }}>
        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Total Cost of Loan</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-label">Loan Amount:</span>
            <span className="text-value">{formatCurrency(results.loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-label">Total Interest:</span>
            <span className="text-value">{formatCurrency(results.totalInterest)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-label">Total Amount to Repay:</span>
            <span className="text-value font-bold" style={{ fontSize: '17px' }}>{formatCurrency(results.totalPayment)}</span>
          </div>
        </div>
      </div>

      {/* Pie Chart - Loan Structure */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Loan Structure</h3>
        <div className="w-full" style={{ maxHeight: '250px' }}>
          {results.chartData && (
            <LoanStructureChart 
              key={`chart-${JSON.stringify(results.chartData)}`}
              data={{
                ...results.chartData,
                datasets: [{
                  ...results.chartData.datasets[0],
                  backgroundColor: [
                    'var(--color-principal)',
                    'var(--color-interest)'
                  ]
                }]
              }} 
            />
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block mr-2 rounded-sm" style={{ backgroundColor: 'var(--color-principal)' }}></span>
            <span className="text-sm" style={{ color: 'var(--color-heading)' }}>Principal: {formatCurrency(results.loanAmount)}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block mr-2 rounded-sm" style={{ backgroundColor: 'var(--color-interest)' }}></span>
            <span className="text-sm" style={{ color: 'var(--color-heading)' }}>Interest: {formatCurrency(results.totalInterest)}</span>
          </div>
        </div>
        
        <p className="mt-4 text-xs" style={{ color: 'var(--color-text)' }}>
          This calculation is for guidance only. The actual mortgage terms may vary based on bank's policies and your individual circumstances.
        </p>
      </div>
    </div>
  );
};

export default ResultsDisplay;