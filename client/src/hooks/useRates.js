import axios from 'axios';

/**
 * Fetch the base interest rate from the API
 * @returns {Promise<{baseRate: number}>} The base rate data
 */
export const fetchBaseRate = async () => {
  try {
    const response = await axios.get('/api/base-rate', {
      timeout: 5000 // Add timeout to prevent hanging requests
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching base rate:', error);
    throw error;
  }
};