import React from 'react';
import { Currency } from '../utils/exchangeRates';

interface CurrencySelectorProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ currency, onCurrencyChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCurrencyChange(e.target.value as Currency);
  };

  return (
    <div className="mb-4">
      <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
        Currency
      </label>
      <select
        id="currency"
        value={currency}
        onChange={handleChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="PLN">Polish Złoty (PLN)</option>
        <option value="EUR">Euro (EUR)</option>
        <option value="USD">US Dollar (USD)</option>
      </select>
    </div>
  );
};

export default CurrencySelector;