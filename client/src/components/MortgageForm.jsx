import React from 'react';
import { Controller } from 'react-hook-form';

const MortgageForm = ({ control }) => {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Mortgage Parameters</h2>
      <div className="space-y-6">
        {/* Property Value */}
        <div>
          <label htmlFor="propertyValue" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            )}
          />
        </div>

        {/* Down Payment Percentage */}
        <div>
          <label htmlFor="downPaymentPercent" className="block text-sm font-medium text-gray-700">
            Down Payment ({control._formValues.downPaymentPercent}%)
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
                />
                <div className="flex justify-between text-xs text-gray-500">
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
          <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700">
            Loan Term ({control._formValues.loanTerm} years)
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
                />
                <div className="flex justify-between text-xs text-gray-500">
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
          <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
            Interest Rate (%)
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            )}
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Adjust the parameters above to see how they affect your mortgage calculation.
      </p>
    </div>
  );
};

export default MortgageForm;