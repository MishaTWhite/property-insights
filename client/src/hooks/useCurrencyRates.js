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
          const gbpRate = nbpRates.find(rate => rate.code === 'GBP')?.mid;
          
          // NBP API returns rates as how many PLN for 1 unit of foreign currency
          // This is the correct format for our needs (no need to invert)
          setRates({
            PLN: 1,
            EUR: eurRate || null,
            USD: usdRate || null,
            UAH: uahRate || null,
            GBP: gbpRate || null,
          });
          setError(null);
        } else {
          throw new Error('Invalid response format from NBP API');
        }
      } catch (nbpError) {
        console.error('Error fetching from NBP API, falling back to exchangerate.host:', nbpError);
        
        // Fallback to exchangerate.host
        try {
          // Use EUR as base and convert to PLN
          const fallbackResponse = await axios.get('https://api.exchangerate.host/latest?base=EUR', {
            timeout: 5000
          });
          
          if (fallbackResponse.data && fallbackResponse.data.rates && fallbackResponse.data.rates.PLN) {
            // Calculate rates relative to PLN
            const plnRate = fallbackResponse.data.rates.PLN;
            
            setRates({
              PLN: 1,
              EUR: plnRate / fallbackResponse.data.rates.EUR || null,
              USD: plnRate / fallbackResponse.data.rates.USD || null,
              UAH: plnRate / fallbackResponse.data.rates.UAH || null,
              GBP: plnRate / fallbackResponse.data.rates.GBP || null,
            });
            setError(null);
          } else {
            throw new Error('Invalid response from fallback API');
          }
        } catch (fallbackError) {
          console.error('Error with fallback API:', fallbackError);
          setError('Failed to fetch exchange rates. Please try again later.');
          // Don't set default rates, keep them as null
          setRates({
            PLN: 1,
            EUR: null,
            USD: null,
            UAH: null,
            GBP: null,
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