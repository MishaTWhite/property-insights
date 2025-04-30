import axios from 'axios';

/**
 * Fetch the base interest rate from the API
 * @returns {Promise<{baseRate: number}>} The base rate data
 */
export const fetchBaseRate = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/base-rate');
    return response.data;
  } catch (error) {
    console.error('Error fetching base rate:', error);
    throw error;
  }
};