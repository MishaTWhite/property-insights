import { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Custom hook to preserve loan term when currency changes
 * @param {object} control - The react-hook-form control object
 * @param {function} setValue - The react-hook-form setValue function
 * @returns {object} - Object containing state and methods to handle currency changes
 */
export const useLoanTermPreservation = (control, setValue) => {
  const [previousCurrency, setPreviousCurrency] = useState(null);
  const { currency } = useCurrency();
  const DEFAULT_LOAN_TERM = 30; // Set default loan term to 30 years

  useEffect(() => {
    // If this is the first render, set the loan term to 30 years
    if (!previousCurrency) {
      setValue('loanTerm', DEFAULT_LOAN_TERM);
      setPreviousCurrency(currency);
      return;
    }

    // If currency has changed, preserve the loan term at the current value
    // (don't reset it to DEFAULT_LOAN_TERM)
    if (previousCurrency !== currency) {
      setPreviousCurrency(currency);
      // We don't set loanTerm here to preserve user's selection
    }
  }, [currency, previousCurrency, setValue]);

  return {
    isCurrencyChanged: previousCurrency !== null && previousCurrency !== currency,
    currentCurrency: currency,
    previousCurrency,
    DEFAULT_LOAN_TERM,
  };
};