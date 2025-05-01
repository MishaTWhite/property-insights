import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCurrencyRates } from '../hooks/useCurrencyRates';

// Create context
const CurrencyContext = createContext();

// Currency symbols and flags for UI
export const CURRENCY_INFO = {
  PLN: { symbol: 'zł', flag: '🇵🇱', name: 'PLN' },
  EUR: { symbol: '€', flag: '🇪🇺', name: 'EUR' },
  USD: { symbol: '$', flag: '🇺🇸', name: 'USD' },
  UAH: { symbol: '₴', flag: '🇺🇦', name: 'UAH' },
};

// Provider component
export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('PLN'); // Default to PLN
  const { rates, isLoading, error } = useCurrencyRates();

  // Convert a value from PLN to the selected currency
  const convertAmount = (amount, toCurrency = currency) => {
    if (!amount || isLoading || !rates[toCurrency]) {
      return amount; // Return original if no conversion possible
    }
    // Convert and round to nearest integer
    return Math.round(amount * rates[toCurrency]);
  };

  // Format an amount with the currency symbol WITHOUT conversion
  // The amounts should already be converted by usePropertyValueWithCurrency
  const formatWithCurrency = (amount, toCurrency = currency) => {
    const currencyInfo = CURRENCY_INFO[toCurrency];
    
    // Format with thousands separator and currency symbol
    return `${amount.toLocaleString()} ${currencyInfo.symbol}`;
  };

  // The context value
  const contextValue = {
    currency,
    setCurrency,
    rates,
    isLoading,
    error,
    convertAmount,
    formatWithCurrency,
    currencyInfo: CURRENCY_INFO,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use currency context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};