import { useState, useEffect } from 'react';
import bankOffers from '../data/bankOffers';

/**
 * Custom hook to provide bank mortgage offers from local data
 * @returns {Object} Bank offers data and loading state
 */
export const useBankOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading to maintain the same component behavior
    // This could be removed if immediate loading is preferred
    const timer = setTimeout(() => {
      try {
        setOffers(bankOffers);
        setError(null);
      } catch (error) {
        console.error('Error loading bank offers:', error);
        setError('Failed to load bank offers. Please try again later.');
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Short timeout to simulate network request

    return () => clearTimeout(timer);
  }, []);

  return { offers, loading, error };
};

export default useBankOffers;