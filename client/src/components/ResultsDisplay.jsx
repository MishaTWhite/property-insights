import React from 'react';
import { formatCurrency } from '../utils/mortgageCalculations';
import { useCurrency } from '../context/CurrencyContext';

// Horizontal bar chart component for loan structure
const LoanStructureChart = ({ principalAmount, interestAmount, totalAmount }) => {
  // Calculate percentages
  const principalPercent = Math.round((principalAmount / totalAmount) * 100);
  const interestPercent = 100 - principalPercent;
  
  return (
    <div style={{ display: 'flex', height: '60px', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{
        width: `${principalPercent}%`,
        backgroundColor: 'var(--color-principal)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        flexDirection: 'column',
        fontWeight: 600,
        fontSize: '13px'
      }}>
        <div>{principalPercent}%</div>
        <div>principal</div>
      </div>
      <div style={{
        width: `${interestPercent}%`,
        backgroundColor: 'var(--color-interest)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        flexDirection: 'column',
        fontWeight: 600,
        fontSize: '13px'
      }}>
        <div>{interestPercent}%</div>
        <div>interest</div>
      </div>
    </div>
  );
};

const ResultsDisplay = ({ results }) => {
  // Always render the component, but conditionally show different content
  // This ensures hooks are always called in the same order
  const { formatWithCurrency } = useCurrency();
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>Calculation Results</h2>
      
      {!results ? (
        <div>Enter your mortgage details to see results</div>
      ) : (
        <>
          {/* Loan Summary */}
          <div className="p-4 rounded border" style={{ backgroundColor: '#f2f4f6', borderColor: '#dee2e6' }}>
            <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Loan Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-label">Loan Amount:</span>
                <span className="text-value">{formatWithCurrency(results.loanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label">Monthly Payment:</span>
                <span className="text-value font-bold" style={{ color: 'var(--color-accent)' }}>{formatWithCurrency(results.monthlyPayment)}</span>
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
                <span className="text-value">{formatWithCurrency(results.loanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label">Total Interest:</span>
                <span className="text-value">{formatWithCurrency(results.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label">Total Amount to Repay:</span>
                <span className="text-value font-bold" style={{ fontSize: '17px' }}>{formatWithCurrency(results.totalPayment)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Horizontal Bar Chart - Loan Structure */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Loan Structure</h3>
        <div className="w-full">
          {results?.loanAmount && results.totalInterest && results.totalPayment ? (
            <LoanStructureChart 
              principalAmount={results.loanAmount}
              interestAmount={results.totalInterest}
              totalAmount={results.totalPayment}
            />
          ) : (
            <div>Complete loan details needed for chart</div>
          )}
        </div>
        
        <p className="mt-4 text-xs" style={{ color: 'var(--color-text)' }}>
          This calculation is for guidance only and might differ from a bank's offer. Actual rates and payments depend on individual credit assessment.
        </p>
      </div>
    </div>
  );
};

export default ResultsDisplay;