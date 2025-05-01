import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/mortgageCalculations';

const AcceleratedRepaymentPanel = ({ results }) => {
  const [accelerationMonths, setAccelerationMonths] = useState(12); // Default: 1 year
  const [paymentMultiplier, setPaymentMultiplier] = useState(1.5); // Default: 1.5x
  const [acceleratedResults, setAcceleratedResults] = useState(null);
  
  useEffect(() => {
    if (!results) return;
    
    // Calculate accelerated repayment effects
    calculateAcceleratedResults(results, accelerationMonths, paymentMultiplier);
  }, [results, accelerationMonths, paymentMultiplier]);
  
  const calculateAcceleratedResults = (results, months, multiplier) => {
    if (!results) return;
    
    const {
      loanAmount,
      interestRate,
      loanTerm
    } = results;
    
    const originalTotalMonths = loanTerm * 12;
    const originalMonthlyPayment = results.monthlyPayment;
    const acceleratedMonthlyPayment = originalMonthlyPayment * multiplier;
    
    // Convert annual interest rate to monthly
    const monthlyInterestRate = interestRate / 100 / 12;
    
    // Calculate remaining principal after accelerated period
    let remainingPrincipal = loanAmount;
    let monthsCounter = 0;
    
    // Simulate accelerated payments for specified months
    for (let i = 0; i < months; i++) {
      if (remainingPrincipal <= 0) break;
      
      // Calculate interest for this month
      const monthlyInterest = remainingPrincipal * monthlyInterestRate;
      
      // Calculate principal payment for this month
      const principalPayment = acceleratedMonthlyPayment - monthlyInterest;
      
      // Update remaining principal
      remainingPrincipal -= principalPayment;
      monthsCounter++;
      
      // If loan is paid off during accelerated period
      if (remainingPrincipal <= 0) {
        break;
      }
    }
    
    // If there's remaining principal, calculate new loan term and payment
    let newMonthlyPayment = originalMonthlyPayment;
    let newTotalMonths = originalTotalMonths;
    
    if (remainingPrincipal > 0) {
      // Recalculate loan term with original payment
      // Formula to solve for n (number of months):
      // n = log(M / (M - P*r)) / log(1 + r)
      // Where M is monthly payment, P is principal, r is monthly interest rate
      const minPayment = remainingPrincipal * monthlyInterestRate;
      
      if (originalMonthlyPayment > minPayment) {
        const newRemainingMonths = Math.log(originalMonthlyPayment / (originalMonthlyPayment - remainingPrincipal * monthlyInterestRate)) / 
                                   Math.log(1 + monthlyInterestRate);
        
        newTotalMonths = Math.ceil(monthsCounter + newRemainingMonths);
      }
    } else {
      // Loan fully paid during accelerated period
      newTotalMonths = monthsCounter;
    }
    
    // Calculate time saved
    const monthsSaved = originalTotalMonths - newTotalMonths;
    const yearsSaved = Math.floor(monthsSaved / 12);
    const remainingMonthsSaved = monthsSaved % 12;
    
    // Calculate interest savings (original interest - new interest)
    const originalTotalPayment = originalMonthlyPayment * originalTotalMonths;
    const newTotalPayment = acceleratedMonthlyPayment * months + 
                           (newTotalMonths > months ? originalMonthlyPayment * (newTotalMonths - months) : 0);
    
    const originalInterestPaid = originalTotalPayment - loanAmount;
    const newInterestPaid = newTotalPayment - loanAmount;
    const interestSavings = originalInterestPaid - newInterestPaid;
    
    setAcceleratedResults({
      newTotalMonths,
      monthsSaved,
      yearsSaved,
      remainingMonthsSaved,
      newMonthlyPayment,
      acceleratedMonthlyPayment,
      interestSavings,
      originalTotalPayment,
      newTotalPayment
    });
  };
  
  // Format months for display (convert to "X years Y months")
  const formatMonths = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    } else if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
  };
  
  // Format acceleration months as years and months for display
  const formatAccelerationPeriod = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    } else if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-heading)' }}>Accelerated Repayment</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
        See how making additional payments for a certain period can reduce the loan term or future monthly payments.
      </p>
      
      {!results ? (
        <div>Enter your mortgage details to see accelerated repayment options</div>
      ) : (
        <div className="space-y-6">
          {/* Sliders */}
          <div className="space-y-6">
            {/* Duration Slider */}
            <div>
              <label className="block text-label mb-2 flex justify-between">
                <span>Duration of accelerated repayment</span>
                <span className="font-semibold">{formatAccelerationPeriod(accelerationMonths)}</span>
              </label>
              <input
                type="range"
                min="1"
                max="60" // 5 years
                value={accelerationMonths}
                onChange={(e) => setAccelerationMonths(Number(e.target.value))}
                className="block w-full mb-2"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span>1 month</span>
                <span>5 years</span>
              </div>
            </div>
            
            {/* Payment Multiplier Slider */}
            <div>
              <label className="block text-label mb-2 flex justify-between">
                <span>Payment multiplier</span>
                <span className="font-semibold">{paymentMultiplier.toFixed(1)}x ({formatCurrency(results.monthlyPayment * paymentMultiplier)})</span>
              </label>
              <input
                type="range"
                min="1.1"
                max="3.0"
                step="0.1"
                value={paymentMultiplier}
                onChange={(e) => setPaymentMultiplier(Number(e.target.value))}
                className="block w-full mb-2"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span>1.1x</span>
                <span>3.0x</span>
              </div>
            </div>
          </div>
          
          {/* Results */}
          {acceleratedResults && (
            <div className="p-5 rounded" style={{ backgroundColor: '#f7f8f9' }}>
              <h3 className="text-md font-semibold mb-4" style={{ color: 'var(--color-heading)' }}>Impact on Your Mortgage</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Loan Term Reduction */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    If you make {paymentMultiplier.toFixed(1)}x payments for {formatAccelerationPeriod(accelerationMonths)}:
                  </p>
                  <div className="mb-1">
                    <span className="block text-sm mb-1">Loan term reduction</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                      {acceleratedResults.yearsSaved > 0 || acceleratedResults.remainingMonthsSaved > 0 ? 
                        `${acceleratedResults.yearsSaved} ${acceleratedResults.yearsSaved === 1 ? 'year' : 'years'}${acceleratedResults.remainingMonthsSaved > 0 ? ` ${acceleratedResults.remainingMonthsSaved} ${acceleratedResults.remainingMonthsSaved === 1 ? 'month' : 'months'}` : ''}` : 
                        'No reduction'}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="block text-sm mb-1">Interest savings</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                      {formatCurrency(acceleratedResults.interestSavings)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">New loan term:</span>
                    <span className="text-sm ml-1">{formatMonths(acceleratedResults.newTotalMonths)}</span>
                  </div>
                </div>
                
                {/* Card 2: Payment Details */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <div className="mb-1">
                    <span className="block text-sm mb-1">Standard monthly payment</span>
                    <span className="text-base font-semibold">{formatCurrency(results.monthlyPayment)}</span>
                  </div>
                  <div className="mb-1">
                    <span className="block text-sm mb-1">Accelerated monthly payment</span>
                    <span className="text-base font-semibold">{formatCurrency(acceleratedResults.acceleratedMonthlyPayment)}</span>
                    <span className="text-xs ml-1 text-gray-500">
                      (for {formatAccelerationPeriod(accelerationMonths)})
                    </span>
                  </div>
                  {acceleratedResults.interestSavings > 0 && (
                    <div className="mt-2">
                      <span className="bg-green-100 text-green-700 text-sm font-medium px-2 py-1 rounded-md inline-flex items-center">
                        💰 You save {formatCurrency(acceleratedResults.interestSavings)} in interest
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcceleratedRepaymentPanel;