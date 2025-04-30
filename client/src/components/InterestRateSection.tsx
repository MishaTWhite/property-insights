import React from 'react';

interface InterestRateSectionProps {
  baseRate: number;
  bankMargin: number;
  onBaseRateChange: (rate: number) => void;
  onBankMarginChange: (margin: number) => void;
}

const InterestRateSection: React.FC<InterestRateSectionProps> = ({
  baseRate,
  bankMargin,
  onBaseRateChange,
  onBankMarginChange,
}) => {
  const handleBaseRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onBaseRateChange(value);
    }
  };

  const handleBankMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onBankMarginChange(value);
    }
  };

  const totalRate = baseRate + bankMargin;

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Interest Rate</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="baseRate" className="block text-sm font-medium text-gray-700 mb-1">
            Base Rate (%)
          </label>
          <input
            type="number"
            id="baseRate"
            value={baseRate}
            onChange={handleBaseRateChange}
            step="0.01"
            min="0"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="bankMargin" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Margin (%)
          </label>
          <input
            type="number"
            id="bankMargin"
            value={bankMargin}
            onChange={handleBankMarginChange}
            step="0.01"
            min="0"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded-md border border-indigo-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Interest Rate:</span>
          <span className="text-lg font-semibold text-indigo-600">{totalRate.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

export default InterestRateSection;