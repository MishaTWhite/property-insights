import { useState, useEffect } from 'react';
import axios from 'axios';
import MortgageCalculator from './components/MortgageCalculator';
import { fetchBaseRate } from './hooks/useRates';
import LoadingOverlay from './components/LoadingOverlay';

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
        // Continue with a fallback value rather than getting stuck
        setBaseRate(7.75);
      } finally {
        // Always set isLoading to false, even when there's an error
        setIsLoading(false);
      }
    };

    getBaseRate();
  }, []);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-heading)' }}>
            Polish Mortgage Calculator
          </h1>
          <p className="mt-3 text-xl" style={{ color: 'var(--color-text)' }}>
            Get insights into your mortgage payments and loan structure
          </p>
        </div>

        {isLoading ? (
          <LoadingOverlay message="Loading base interest rate..." />
        ) : (
          <MortgageCalculator defaultInterestRate={baseRate} />
        )}

      </div>
    </div>
  );
}

export default App;