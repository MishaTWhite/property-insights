import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/mortgageCalculations';
import { useCurrency } from '../context/CurrencyContext';

const AcceleratedRepaymentPanel = ({ results }) => {
  const [accelerationMonths, setAccelerationMonths] = useState(12); // Default: 1 year
  const { formatWithCurrency, convertAmount } = useCurrency();
  const [paymentMultiplier, setPaymentMultiplier] = useState(1.5); // Default: 1.5x
  const [acceleratedResults, setAcceleratedResults] = useState(null);
  const [repaymentMode, setRepaymentMode] = useState('shorter-term'); // Default mode: shorter-term
  
  useEffect(() => {
    if (!results) return;
    
    // Calculate accelerated repayment effects
    calculateAcceleratedResults(results, accelerationMonths, paymentMultiplier, repaymentMode);
  }, [results, accelerationMonths, paymentMultiplier, repaymentMode]);
  
  const calculateAcceleratedResults = (results, months, multiplier, mode) => {
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
    
    // Variables for both modes
    let newMonthlyPayment = originalMonthlyPayment;
    let newTotalMonths = originalTotalMonths;
    let monthlySavings = 0;
    let yearsSaved = 0;
    let remainingMonthsSaved = 0;
    let monthsSaved = 0;
    
    if (mode === 'shorter-term') {
      // Shorter Term Mode: Keep payment constant, reduce term
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
      monthsSaved = originalTotalMonths - newTotalMonths;
      yearsSaved = Math.floor(monthsSaved / 12);
      remainingMonthsSaved = monthsSaved % 12;
      
    } else if (mode === 'lower-payments') {
      // Lower Payments Mode: Keep term constant, reduce payment
      
      if (remainingPrincipal > 0) {
        // Remaining term after accelerated period
        const remainingTerm = originalTotalMonths - months;
        
        if (remainingTerm > 0) {
          // Calculate new monthly payment for remaining term
          // Formula: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
          // Where P is principal, r is monthly rate, n is remaining months
          newMonthlyPayment = 
            (remainingPrincipal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, remainingTerm)) / 
            (Math.pow(1 + monthlyInterestRate, remainingTerm) - 1);
          
          // Calculate monthly savings compared to original payment
          monthlySavings = originalMonthlyPayment - newMonthlyPayment;
        }
      } else {
        // Loan fully paid during accelerated period
        newTotalMonths = monthsCounter;
        newMonthlyPayment = 0;
        monthlySavings = originalMonthlyPayment;
      }
    }
    
    // Calculate interest savings (original interest - new interest)
    const originalTotalPayment = originalMonthlyPayment * originalTotalMonths;
    
    let newTotalPayment;
    if (mode === 'shorter-term') {
      newTotalPayment = acceleratedMonthlyPayment * months + 
                       (newTotalMonths > months ? originalMonthlyPayment * (newTotalMonths - months) : 0);
    } else {
      // Lower payments mode
      newTotalPayment = acceleratedMonthlyPayment * months + 
                       (originalTotalMonths > months ? newMonthlyPayment * (originalTotalMonths - months) : 0);
    }
    
    const originalInterestPaid = originalTotalPayment - loanAmount;
    const newInterestPaid = newTotalPayment - loanAmount;
    const interestSavings = originalInterestPaid - newInterestPaid;
    
    setAcceleratedResults({
      mode,
      newTotalMonths,
      monthsSaved,
      yearsSaved,
      remainingMonthsSaved,
      newMonthlyPayment,
      acceleratedMonthlyPayment,
      monthlySavings,
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
                <span className="font-semibold">{paymentMultiplier.toFixed(1)}x ({formatWithCurrency(results.monthlyPayment * paymentMultiplier)})</span>
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
          
          {/* Mode Toggle */}
          <div className="mb-4">
            <div className="flex justify-center space-x-2 border rounded-md p-1 w-full max-w-md mx-auto">
              <button
                onClick={() => setRepaymentMode('shorter-term')}
                className={`flex-1 py-2 px-4 rounded ${
                  repaymentMode === 'shorter-term' 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'bg-white text-gray-700'
                }`}
              >
                🎯 Shorter Term
              </button>
              <button
                onClick={() => setRepaymentMode('lower-payments')}
                className={`flex-1 py-2 px-4 rounded ${
                  repaymentMode === 'lower-payments' 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'bg-white text-gray-700'
                }`}
              >
                💸 Lower Payments
              </button>
            </div>
            <p className="text-sm mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Choose whether to shorten the loan term or reduce future monthly payments.
            </p>
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
                  {repaymentMode === 'lower-payments' && (
                    <div className="mb-1">
                      <span className="block text-sm mb-1">Interest savings</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                        {formatWithCurrency(acceleratedResults.interestSavings)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">New loan term:</span>
                    <span className="text-sm ml-1">{formatMonths(acceleratedResults.newTotalMonths)}</span>
                  </div>
                </div>
                
                {/* Card 2: Payment Details */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <div className="mb-1">
                    <span className="block text-sm mb-1">Standard monthly payment</span>
                    <span className="text-base font-semibold">{formatWithCurrency(results.monthlyPayment)}</span>
                  </div>
                  <div className="mb-1">
                    <span className="block text-sm mb-1">Accelerated monthly payment</span>
                    <span className="text-base font-semibold">{formatWithCurrency(acceleratedResults.acceleratedMonthlyPayment)}</span>
                    <span className="text-xs ml-1 text-gray-500">
                      (for {formatAccelerationPeriod(accelerationMonths)})
                    </span>
                  </div>
                  {repaymentMode === 'lower-payments' && acceleratedResults.newMonthlyPayment > 0 && (
                    <div className="mb-1">
                      <span className="block text-sm mb-1">New monthly payment after accelerated period</span>
                      <span className="text-base font-semibold" style={{ color: 'var(--color-accent)' }}>
                        {formatWithCurrency(acceleratedResults.newMonthlyPayment)}
                      </span>
                    </div>
                  )}
                  {/* Savings pill - different displays based on mode */}
                  <div className="mt-2">
                    {repaymentMode === 'shorter-term' && acceleratedResults.interestSavings > 0 && (
                      <span className="bg-green-100 text-green-700 text-sm font-medium px-2 py-1 rounded-md inline-flex items-center">
                        💰 You save {formatWithCurrency(acceleratedResults.interestSavings)} in interest
                      </span>
                    )}
                    
                    {repaymentMode === 'lower-payments' && acceleratedResults.monthlySavings > 0 && (
                      <span className="bg-green-100 text-green-700 text-sm font-medium px-2 py-1 rounded-md inline-flex items-center">
                        💰 You save {formatWithCurrency(acceleratedResults.monthlySavings)}/month
                      </span>
                    )}
                  </div>
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