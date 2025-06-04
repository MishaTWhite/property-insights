import { useState, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Custom hook to handle property value conversions when currency changes
 * @param {object} control - The react-hook-form control object
 * @param {function} setValue - The react-hook-form setValue function
 * @returns {object} - Object containing methods and state for property value handling
 */
export const usePropertyValueWithCurrency = (control, setValue) => {
  // Ensure setValue is a function
  if (typeof setValue !== 'function') {
    console.error('setValue function not provided to usePropertyValueWithCurrency');
    setValue = (name, value) => {
      console.warn(`Trying to set ${name} to ${value} but setValue is not available`);
    };
  }
  const [internalValuePLN, setInternalValuePLN] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const { currency, rates } = useCurrency();
  
  // Get the current property value from the form
  const currentPropertyValue = useWatch({
    control,
    name: 'propertyValue',
    defaultValue: 500000 // Default value if none set
  });
  
  // Initialize the internal PLN value from the form's initial value
  useEffect(() => {
    if (!initialized && currentPropertyValue) {
      // If starting with non-PLN currency, convert back to PLN
      if (currency !== 'PLN' && rates && rates[currency]) {
        // Convert from foreign currency to PLN by multiplying by the rate
        setInternalValuePLN(Math.round(currentPropertyValue * rates[currency]));
      } else {
        setInternalValuePLN(currentPropertyValue);
      }
      setInitialized(true);
    }
  }, [currentPropertyValue, initialized, currency, rates]);

  // Main effect to handle currency changes and rate updates
  useEffect(() => {
    // Skip if we don't have an internal PLN value yet
    if (internalValuePLN === null) return;
    
    // Only proceed if we have rates for non-PLN currency
    if (currency !== 'PLN' && (!rates || !rates[currency])) {
      console.warn('Currency rates not available for', currency);
      return;
    }
    
    // Convert from PLN to the selected currency
    const convertedValue = currency === 'PLN' 
      ? internalValuePLN 
      : Math.round(internalValuePLN / rates[currency]);
    
    // Update the form value immediately
    setValue('propertyValue', convertedValue);
    
    // Debug log to confirm conversion is working
    console.log(`Converting ${internalValuePLN} PLN to ${convertedValue} ${currency}`);
    
  }, [currency, internalValuePLN, rates, setValue]);

  // Handle user input changes - convert back to PLN for internal storage
  const handlePropertyValueChange = (value) => {
    const numericValue = Number(value) || 0;
    
    // Store the converted value in PLN
    if (currency === 'PLN') {
      setInternalValuePLN(numericValue);
    } else if (rates[currency]) {
      // Convert from current currency back to PLN
      // If rate is how many PLN for 1 unit of foreign currency,
      // then to convert from foreign to PLN, we multiply by the rate
      const valueInPLN = Math.round(numericValue * rates[currency]);
      setInternalValuePLN(valueInPLN);
    }
    
    // Return the displayed value (in current currency)
    return numericValue;
  };

  return {
    internalValuePLN,
    handlePropertyValueChange,
  };
};