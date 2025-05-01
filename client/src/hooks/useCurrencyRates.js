import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to fetch and manage currency exchange rates
 * @returns {Object} Currency rates and loading state
 */
export const useCurrencyRates = () => {
  const [rates, setRates] = useState({
    EUR: null,
    USD: null,
    UAH: null,
    PLN: 1, // Base currency is always 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        // Try NBP API first
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json', {
          timeout: 5000
        });
        
        // Process NBP data
        if (response.data && response.data[0] && response.data[0].rates) {
          const nbpRates = response.data[0].rates;
          const eurRate = nbpRates.find(rate => rate.code === 'EUR')?.mid;
          const usdRate = nbpRates.find(rate => rate.code === 'USD')?.mid;
          const uahRate = nbpRates.find(rate => rate.code === 'UAH')?.mid;
          
          // For NBP API, rates are given as PLN to other currency
          // We need the inverse for converting from PLN to other currencies
          setRates({
            PLN: 1,
            EUR: eurRate ? 1 / eurRate : null,
            USD: usdRate ? 1 / usdRate : null,
            UAH: uahRate ? 1 / uahRate : null,
          });
          setError(null);
        } else {
          throw new Error('Invalid response format from NBP API');
        }
      } catch (nbpError) {
        console.error('Error fetching from NBP API, falling back to exchangerate.host:', nbpError);
        
        // Fallback to exchangerate.host
        try {
          const fallbackResponse = await axios.get('https://api.exchangerate.host/latest?base=PLN', {
            timeout: 5000
          });
          
          if (fallbackResponse.data && fallbackResponse.data.rates) {
            setRates({
              PLN: 1,
              EUR: fallbackResponse.data.rates.EUR || null,
              USD: fallbackResponse.data.rates.USD || null,
              UAH: fallbackResponse.data.rates.UAH || null,
            });
            setError(null);
          } else {
            throw new Error('Invalid response from fallback API');
          }
        } catch (fallbackError) {
          console.error('Error with fallback API:', fallbackError);
          setError('Failed to fetch exchange rates. Please try again later.');
          // Set some default rates for demonstration
          setRates({
            PLN: 1,
            EUR: 0.23, // Approximate values
            USD: 0.25,
            UAH: 9.2,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  return { rates, isLoading, error };
};