import React from 'react';
import MortgageCalculator from './components/MortgageCalculator';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <MortgageCalculator />
      </div>
    </div>
  );
}

export default App;