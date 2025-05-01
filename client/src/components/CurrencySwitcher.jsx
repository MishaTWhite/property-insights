import React from 'react';
import { useCurrency, CURRENCY_INFO } from '../context/CurrencyContext';

const CurrencySwitcher = () => {
  const { currency, setCurrency, rates, isLoading, error } = useCurrency();

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  return (
    <div className="flex flex-col items-end mb-2">
      <div className="relative">
        <label htmlFor="currency-selector" className="sr-only">Select Currency</label>
        <select
          id="currency-selector"
          className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          value={currency}
          onChange={handleCurrencyChange}
          disabled={isLoading}
        >
          {Object.entries(CURRENCY_INFO).map(([code, info]) => (
            <option key={code} value={code}>
              {info.flag} {info.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Exchange rate info */}
      {!isLoading && rates && currency !== 'PLN' && (
        <div className="text-xs text-gray-500 mt-1">
          1 PLN = {rates[currency] ? rates[currency].toFixed(4) : '?'} {CURRENCY_INFO[currency].symbol}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;