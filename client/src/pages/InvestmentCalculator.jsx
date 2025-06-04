import React from 'react';
import InvestmentCalculator from '../components/InvestmentCalculator';

function InvestmentCalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Investment Growth Calculator</h1>
      <InvestmentCalculator />
    </div>
  );
}

export default InvestmentCalculatorPage;