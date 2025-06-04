import baseRates from '../data/baseRates';

/**
 * Fetch the base interest rate from local data
 * @returns {Promise<{baseRate: number}>} The base rate data
 */
export const fetchBaseRate = async () => {
  // Simulate API call with a Promise
  return new Promise((resolve) => {
    // Short timeout to simulate network request
    setTimeout(() => {
      resolve(baseRates);
    }, 100);
  });
};