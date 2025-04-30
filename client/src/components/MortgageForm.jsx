import React from 'react';
import { Controller, useWatch } from 'react-hook-form';

const MortgageForm = ({ control }) => {
  // Use useWatch hook to access form values safely
  const { downPaymentPercent, loanTerm, interestRate } = useWatch({ control });
  return (
    <div>
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>Loan Parameters</h2>
      <div className="space-y-6">
        {/* Property Value */}
        <div>
          <label htmlFor="propertyValue" className="block text-label mb-2">
            Property Value (PLN)
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
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                style={{ backgroundColor: 'var(--color-white)', borderColor: '#ced4da', transition: 'all 0.2s' }}
              />
            )}
          />
        </div>

        {/* Down Payment Percentage */}
        <div>
          <label htmlFor="downPaymentPercent" className="block text-label mb-2">
            Down Payment ({downPaymentPercent}%)
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

        {/* Interest Rate */}
        <div>
          <label htmlFor="interestRate" className="block text-label mb-2">
            Interest Rate ({interestRate}%)
          </label>
          <Controller
            name="interestRate"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="1"
                max="20"
                step="0.01"
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                style={{ backgroundColor: 'var(--color-white)', borderColor: '#ced4da', transition: 'all 0.2s' }}
              />
            )}
          />
        </div>
      </div>

      <p className="mt-6 text-sm" style={{ color: 'var(--color-text)' }}>
        Adjust the parameters above to see how they affect your mortgage calculation.
      </p>
    </div>
  );
};

export default MortgageForm;