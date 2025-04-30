import { useState, useEffect } from 'react';
import axios from 'axios';
import MortgageCalculator from './components/MortgageCalculator';
import { fetchBaseRate } from './hooks/useRates';

function App() {
  const [baseRate, setBaseRate] = useState(7.75);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getBaseRate = async () => {
      try {
        const data = await fetchBaseRate();
        setBaseRate(data.baseRate);
      } catch (error) {
        console.error("Failed to fetch base rate:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getBaseRate();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Polish Mortgage Calculator
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Get insights into your mortgage payments and loan structure
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading base interest rate...</span>
          </div>
        ) : (
          <MortgageCalculator defaultInterestRate={baseRate} />
        )}

      </div>
    </div>
  );
}

export default App;