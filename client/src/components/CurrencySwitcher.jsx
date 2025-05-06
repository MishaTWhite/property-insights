import React from 'react';
import { useCurrency, CURRENCY_INFO } from '../context/CurrencyContext';

const CurrencySwitcher = () => {
  const { currency, setCurrency, rates, isLoading, error } = useCurrency();

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  // Filter available currencies based on loaded rates
  const getAvailableCurrencies = () => {
    if (isLoading) {
      // During loading, only show PLN
      return Object.entries(CURRENCY_INFO).filter(([code]) => code === 'PLN');
    }
    
    // After loading, show only currencies with valid rates
    return Object.entries(CURRENCY_INFO).filter(([code]) => 
      code === 'PLN' || (rates[code] !== null && rates[code] !== undefined)
    );
  };

  // Calculate and format the exchange rate display
  const getExchangeRateDisplay = () => {
    if (!rates[currency]) return null;
    
    // Display as 1 EUR = X PLN (for non-PLN currencies)
    if (currency !== 'PLN') {
      return (
        <div className="text-xs text-gray-500 mt-1">
          1 {CURRENCY_INFO[currency].name} = {rates[currency].toFixed(4)} {CURRENCY_INFO['PLN'].symbol}
        </div>
      );
    }
    return null;
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
          {isLoading ? (
            <option value="PLN">Loading exchange rates...</option>
          ) : (
            getAvailableCurrencies().map(([code, info]) => (
              <option key={code} value={code}>
                {info.flag} {info.name}
              </option>
            ))
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Exchange rate info */}
      {!isLoading && getExchangeRateDisplay()}
      
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;