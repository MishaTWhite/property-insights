import React from 'react';
import { Currency, formatCurrency } from '../utils/exchangeRates';

interface ResultsSectionProps {
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  loanDuration: number;
  totalInterestRate: number;
  currency: Currency;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  loanAmount,
  monthlyPayment,
  totalInterest,
  totalRepayment,
  loanDuration,
  totalInterestRate,
  currency,
}) => {
  const ResultItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-3 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Mortgage Summary</h3>
      
      <div className="mb-6">
        <div className="text-center mb-2">
          <span className="text-sm text-gray-500">Monthly Payment</span>
          <div className="text-3xl font-bold text-indigo-600">
            {formatCurrency(Math.round(monthlyPayment), currency)}
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <ResultItem 
          label="Loan Amount" 
          value={formatCurrency(Math.round(loanAmount), currency)} 
        />
        <ResultItem 
          label="Loan Duration" 
          value={`${loanDuration} years (${loanDuration * 12} months)`} 
        />
        <ResultItem 
          label="Interest Rate" 
          value={`${totalInterestRate.toFixed(2)}%`} 
        />
        <ResultItem 
          label="Total Interest" 
          value={formatCurrency(Math.round(totalInterest), currency)} 
        />
        <ResultItem 
          label="Total Repayment" 
          value={formatCurrency(Math.round(totalRepayment), currency)} 
        />
      </div>
    </div>
  );
};

export default ResultsSection;