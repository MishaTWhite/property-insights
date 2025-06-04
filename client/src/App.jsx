import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import MortgageCalculator from './components/MortgageCalculator';
import { fetchBaseRate } from './hooks/useRates';
import LoadingOverlay from './components/LoadingOverlay';
import { CurrencyProvider } from './context/CurrencyContext';
import NavBar from './components/NavBar';
import PropertyAnalyzer from './pages/OtodomAnalyzer';
import InvestmentCalculatorPage from './pages/InvestmentCalculator';
import AIChat from './pages/AIChat';

// Home page component
function HomePage({ baseRate, isLoading }) {
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
          <CurrencyProvider>
            <MortgageCalculator defaultInterestRate={baseRate} />
          </CurrencyProvider>
        )}
      </div>
    </div>
  );
}

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
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage baseRate={baseRate} isLoading={isLoading} />} />
        <Route path="/otodom-analyzer" element={<PropertyAnalyzer />} />
        <Route path="/investment-calculator" element={<InvestmentCalculatorPage />} />
        <Route path="/ai-chat" element={<AIChat />} />
      </Routes>
    </>
  );
}

export default App;