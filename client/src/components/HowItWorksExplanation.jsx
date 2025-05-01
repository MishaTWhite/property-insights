import React from 'react';

const HowItWorksExplanation = () => {
  return (
    <div className="bg-gray-50 rounded-md p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-heading)' }}>How Does It Work?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column — "Input Data" */}
        <div>
          <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--color-heading)' }}>Input Data</h3>
          <ul className="list-disc pl-5 space-y-2" style={{ color: 'var(--color-text)' }}>
            <li>Enter property price</li>
            <li>Set down payment amount (minimum 10%)</li>
            <li>Choose loan period or monthly payment amount</li>
            <li>NBP base rate is automatically fetched</li>
            <li>Adjust bank margin according to current offers</li>
          </ul>
        </div>
        
        {/* Right Column — "Calculation Formula" */}
        <div>
          <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--color-heading)' }}>Calculation Formula</h3>
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              R = K × (r / 12) × (1 + r / 12)^n / ((1 + r / 12)^n - 1)
            </pre>
            <p className="text-sm mt-3" style={{ color: 'var(--color-text-secondary)' }}>Where:</p>
            <ul className="text-sm space-y-1 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              <li>R – monthly payment</li>
              <li>K – loan amount</li>
              <li>r – annual interest rate (as decimal)</li>
              <li>n – number of months (loan term)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksExplanation;