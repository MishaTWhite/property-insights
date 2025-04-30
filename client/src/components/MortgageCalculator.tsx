import React, { useState, useEffect } from 'react';
import { Currency, convertCurrency, formatCurrency } from '../utils/exchangeRates';
import CurrencySelector from './CurrencySelector';
import PropertyPriceInput from './PropertyPriceInput';
import SliderInput from './SliderInput';
import InterestRateSection from './InterestRateSection';
import ResultsSection from './ResultsSection';
import LoanChart from './LoanChart';

const MortgageCalculator: React.FC = () => {
  // State variables
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [propertyPrice, setPropertyPrice] = useState<number>(500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanDuration, setLoanDuration] = useState<number>(25);
  const [baseRate, setBaseRate] = useState<number>(5.75);
  const [bankMargin, setBankMargin] = useState<number>(2);
  
  // Calculated values
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalRepayment, setTotalRepayment] = useState<number>(0);

  // Calculate down payment amount when property price or percentage changes
  useEffect(() => {
    const newDownPaymentAmount = propertyPrice * (downPaymentPercent / 100);
    setDownPaymentAmount(newDownPaymentAmount);
    setLoanAmount(propertyPrice - newDownPaymentAmount);
  }, [propertyPrice, downPaymentPercent]);

  // Calculate monthly payment and other values when relevant inputs change
  useEffect(() => {
    if (loanAmount <= 0) return;

    const totalInterestRate = baseRate + bankMargin;
    const monthlyInterestRate = totalInterestRate / 100 / 12;
    const totalMonths = loanDuration * 12;
    
    // Monthly payment formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    // where L = loan amount, c = monthly interest rate, n = total number of payments
    const monthlyPayment = loanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths)) / 
      (Math.pow(1 + monthlyInterestRate, totalMonths) - 1);
    
    const totalRepayment = monthlyPayment * totalMonths;
    const totalInterest = totalRepayment - loanAmount;
    
    setMonthlyPayment(monthlyPayment);
    setTotalRepayment(totalRepayment);
    setTotalInterest(totalInterest);
  }, [loanAmount, loanDuration, baseRate, bankMargin]);

  // Handle property price change
  const handlePropertyPriceChange = (newPrice: number) => {
    setPropertyPrice(newPrice);
  };

  // Handle down payment percentage change
  const handleDownPaymentChange = (newPercentage: number) => {
    setDownPaymentPercent(newPercentage);
  };

  // Handle loan duration change
  const handleLoanDurationChange = (newDuration: number) => {
    setLoanDuration(newDuration);
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency: Currency) => {
    // Convert property price to the new currency
    const newPropertyPrice = convertCurrency(propertyPrice, currency, newCurrency);
    setCurrency(newCurrency);
    setPropertyPrice(Math.round(newPropertyPrice));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Mortgage Calculator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          <CurrencySelector 
            currency={currency} 
            onCurrencyChange={handleCurrencyChange} 
          />
          
          <PropertyPriceInput 
            propertyPrice={propertyPrice} 
            currency={currency} 
            onPropertyPriceChange={handlePropertyPriceChange} 
          />
          
          <SliderInput 
            label="Down Payment" 
            value={downPaymentPercent} 
            min={10} 
            max={90} 
            step={1} 
            onChange={handleDownPaymentChange} 
            displayValue={`${downPaymentPercent}% (${formatCurrency(downPaymentAmount, currency)})`} 
          />
          
          <SliderInput 
            label="Loan Duration" 
            value={loanDuration} 
            min={5} 
            max={35} 
            step={1} 
            onChange={handleLoanDurationChange} 
            displayValue={`${loanDuration} years`} 
          />
          
          <InterestRateSection 
            baseRate={baseRate} 
            bankMargin={bankMargin} 
            onBaseRateChange={setBaseRate} 
            onBankMarginChange={setBankMargin} 
          />
        </div>
        
        {/* Right Column - Results */}
        <div className="space-y-6">
          <ResultsSection 
            loanAmount={loanAmount}
            monthlyPayment={monthlyPayment}
            totalInterest={totalInterest}
            totalRepayment={totalRepayment}
            loanDuration={loanDuration}
            totalInterestRate={baseRate + bankMargin}
            currency={currency}
          />
          
          <LoanChart 
            loanAmount={loanAmount}
            totalInterest={totalInterest}
          />
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;