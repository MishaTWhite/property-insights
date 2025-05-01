import React from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '../utils/mortgageCalculations';
import { useCurrency } from '../context/CurrencyContext';

const MortgageForm = ({ control, totalInterestRate }) => {
  // Use useWatch hook to access form values safely
  const { downPaymentPercent, loanTerm, monthlyPayment, nbpBaseRate, bankMargin } = useWatch({ control });
  const { formatWithCurrency } = useCurrency();
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

        {/* Monthly Payment Slider - NEW */}
        <div>
          <label htmlFor="monthlyPayment" className="block text-label mb-2 flex justify-between">
            <span>Monthly Payment</span>
            <span>{formatCurrency(monthlyPayment)}</span>
          </label>
          <Controller
            name="monthlyPayment"
            control={control}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="range"
                  min="1000"
                  max="13340"
                  step="10"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-1 block w-full"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text)' }}>
                  <span>{formatCurrency(1000)}</span>
                  <span>{formatCurrency(7170)}</span>
                  <span>{formatCurrency(13340)}</span>
                </div>
              </div>
            )}
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

      <p className="mt-6 text-sm" style={{ color: 'var(--color-text)' }}>
        Adjust the parameters above to see how they affect your mortgage calculation.
      </p>
    </div>
  );
};

export default MortgageForm;