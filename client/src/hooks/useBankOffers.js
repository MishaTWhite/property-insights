import axios from 'axios';
import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch bank mortgage offers
 * @returns {Object} Bank offers data and loading state
 */
export const useBankOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBankOffers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bank-offers', {
          timeout: 5000 // Add timeout to prevent hanging requests
        });
        setOffers(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching bank offers:', error);
        setError('Failed to load bank offers. Please try again later.');
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBankOffers();
  }, []);

  return { offers, loading, error };
};

export default useBankOffers;