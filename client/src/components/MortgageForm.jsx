import React from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '../utils/mortgageCalculations';
import { useCurrency, CURRENCY_INFO } from '../context/CurrencyContext';
import { usePropertyValueWithCurrency } from '../hooks/usePropertyValueWithCurrency';

const MortgageForm = ({ control, totalInterestRate, setValue }) => {
  // Use useWatch hook to access form values safely
  const { downPaymentPercent, loanTerm, monthlyPayment, nbpBaseRate, bankMargin } = useWatch({ control });
  const { formatWithCurrency, currency, convertAmount } = useCurrency();
  // Use the custom hook for property value currency conversion
  const { handlePropertyValueChange } = usePropertyValueWithCurrency(control, setValue);
  return (
    <div>
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>Loan Parameters</h2>
      <div className="space-y-6">
        {/* Property Value */}
        <div>
          <label htmlFor="propertyValue" className="block text-label mb-2">
            Property Value {currency !== 'PLN' ? `(${CURRENCY_INFO[currency].symbol})` : '(PLN)'}
          </label>
          <Controller
            name="propertyValue"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="100000"
                max="10000000"
                step="10000"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  // Process the input change through our currency handler
                  const displayValue = handlePropertyValueChange(value);
                  field.onChange(displayValue);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                style={{ backgroundColor: 'var(--color-white)', borderColor: '#ced4da', transition: 'all 0.2s' }}
              />
            )}
          />
        </div>

        {/* Down Payment Percentage */}
        <div>
          <label htmlFor="downPaymentPercent" className="block text-label mb-2 flex justify-between">
            <span>Down Payment ({downPaymentPercent}%)</span>
            <span>{formatWithCurrency(useWatch({ control, name: 'propertyValue' }) * (downPaymentPercent / 100))}</span>
          </label>
          <Controller
            name="downPaymentPercent"
            control={control}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-1 block w-full"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text)' }}>
                  <span>10%</span>
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>
            )}
          />
        </div>

        {/* Loan Term */}
        <div>
          <label htmlFor="loanTerm" className="block text-label mb-2">
            Loan Term ({loanTerm} years)
          </label>
          <Controller
            name="loanTerm"
            control={control}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-1 block w-full"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text)' }}>
                  <span>5 years</span>
                  <span>20 years</span>
                  <span>35 years</span>
                </div>
              </div>
            )}
          />
        </div>

        {/* Monthly Payment Slider - UPDATED for currency changes */}
        <div>
          <label htmlFor="monthlyPayment" className="block text-label mb-2 flex justify-between">
            <span>Monthly Payment</span>
            <span>{formatWithCurrency(monthlyPayment)}</span>
          </label>
          <Controller
            name="monthlyPayment"
            control={control}
            render={({ field }) => {
              // Calculate payment ranges based on min/max loan terms
              const propertyValue = useWatch({ control, name: 'propertyValue' });
              const downPaymentPercent = useWatch({ control, name: 'downPaymentPercent' });
              const interestRate = useWatch({ control, name: 'interestRate' });
              
              // Function to calculate min/max payment values (copied from MortgageCalculator)
              const calculatePaymentRange = () => {
                // Import this function if needed
                const calculateMortgage = (propertyValue, downPaymentPercent, loanTerm, interestRate) => {
                  const loanAmount = propertyValue * (1 - downPaymentPercent / 100);
                  const monthlyInterestRate = interestRate / 100 / 12;
                  const numberOfPayments = loanTerm * 12;
                  const monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
                                        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
                  return { monthlyPayment };
                };
                
                // Calculate payment for minimum term (5 years)
                const minTermPayment = calculateMortgage(
                  propertyValue,
                  downPaymentPercent,
                  5, // Min term
                  interestRate
                ).monthlyPayment;
                
                // Calculate payment for maximum term (35 years)
                const maxTermPayment = calculateMortgage(
                  propertyValue,
                  downPaymentPercent,
                  35, // Max term
                  interestRate
                ).monthlyPayment;
                
                return { min: Math.round(maxTermPayment), max: Math.round(minTermPayment) };
              };
              
              const paymentRange = calculatePaymentRange();
              const minPayment = paymentRange.min;
              const midPayment = Math.round((paymentRange.min + paymentRange.max) / 2);
              const maxPayment = paymentRange.max;
              
              return (
                <div>
                  <input
                    {...field}
                    type="range"
                    min={minPayment}
                    max={maxPayment}
                    step={10}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      field.onChange(newValue);
                      
                      // Calculate and update slider position (0-100%)
                      if (paymentRange.max !== paymentRange.min) {
                        const sliderPosition = ((newValue - minPayment) / (maxPayment - minPayment)) * 100;
                        // We need to call the parent component's setPaymentSliderPosition if available
                        if (setValue && typeof setValue === 'function') {
                          // Notify MortgageCalculator that user manually changed payment
                          const event = new CustomEvent('paymentSliderPositionChange', { 
                            detail: { 
                              position: Math.max(0, Math.min(100, sliderPosition)),
                              userChangedPayment: true 
                            } 
                          });
                          window.dispatchEvent(event);
                        }
                      }
                    }}
                    className="mt-1 block w-full"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <div className="flex justify-between text-xs" style={{ color: 'var(--color-text)' }}>
                    <span>{formatWithCurrency(minPayment)}</span>
                    <span>{formatWithCurrency(midPayment)}</span>
                    <span>{formatWithCurrency(maxPayment)}</span>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Interest Rate Section - UPDATED */}
        <div>
          <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--color-heading)' }}>Interest Rate Components</h3>
          
          {/* NBP Base Rate */}
          <div className="mb-3">
            <label htmlFor="nbpBaseRate" className="block text-label mb-2">
              NBP Base Rate (%)
            </label>
            <Controller
              name="nbpBaseRate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="0"
                  max="15"
                  step="0.01"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  style={{ backgroundColor: 'var(--color-white)', borderColor: '#ced4da', transition: 'all 0.2s' }}
                />
              )}
            />
            <div className="text-xs mt-1" style={{ color: 'var(--color-text)' }}>
              Based on WIBOR 3M
            </div>
          </div>

          {/* Bank Margin */}
          <div className="mb-3">
            <label htmlFor="bankMargin" className="block text-label mb-2">
              Bank Margin (%)
            </label>
            <Controller
              name="bankMargin"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  style={{ backgroundColor: 'var(--color-white)', borderColor: '#ced4da', transition: 'all 0.2s' }}
                />
              )}
            />
          </div>

          {/* Total Interest Rate Display */}
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-label">Total Interest Rate:</span>
              <span className="text-value font-bold" style={{ color: 'var(--color-accent)', fontSize: '16px' }}>
                {totalInterestRate.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text)' }}>
              Based on WIBOR 3M ({nbpBaseRate?.toFixed(2) || '5.88'}%) + Bank Margin ({bankMargin?.toFixed(2) || '2.10'}%)
            </div>
          </div>
        </div>
      </div>

      {/* Loan Amount Display */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-label">Loan Amount:</span>
          <span className="text-value font-bold" style={{ color: 'var(--color-heading)', fontSize: '16px' }}>
            {formatWithCurrency(useWatch({ control, name: 'propertyValue' }) * (1 - downPaymentPercent / 100))}
          </span>
        </div>
      </div>

      <p className="mt-6 text-sm" style={{ color: 'var(--color-text)' }}>
        Adjust the parameters above to see how they affect your mortgage calculation.
      </p>
    </div>
  );
};

export default MortgageForm;