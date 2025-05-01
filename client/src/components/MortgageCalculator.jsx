import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import MortgageForm from './MortgageForm';
import ResultsDisplay from './ResultsDisplay';
import BankOffersTable from './BankOffersTable';
import { calculateMortgage, calculateLoanTermFromMonthlyPayment } from '../utils/mortgageCalculations';

const MortgageCalculator = ({ defaultInterestRate }) => {
  const { control, watch, setValue } = useForm({
    defaultValues: {
      propertyValue: 500000,
      downPaymentPercent: 20,
      loanTerm: 25,
      monthlyPayment: 2229,
      nbpBaseRate: 5.88, // Default NBP Base Rate (WIBOR 3M)
      bankMargin: 2.10,  // Default Bank Margin
      interestRate: defaultInterestRate,
    },
  });

  const formValues = watch();
  const [results, setResults] = useState(null);
  // Track the total interest rate (NBP Rate + Bank Margin)
  const [totalInterestRate, setTotalInterestRate] = useState(
    formValues.nbpBaseRate + formValues.bankMargin
  );

  useEffect(() => {
    // Update interest rate if defaultInterestRate changes
    setValue('interestRate', defaultInterestRate);
  }, [defaultInterestRate, setValue]);

  useEffect(() => {
    // Calculate total interest rate from NBP base rate and bank margin
    const calculatedTotalRate = formValues.nbpBaseRate + formValues.bankMargin;
    setTotalInterestRate(calculatedTotalRate);
    setValue('interestRate', calculatedTotalRate);
  }, [formValues.nbpBaseRate, formValues.bankMargin, setValue]);
  
  // Add flags to track if updates are triggered by other field changes to prevent circular updates
  const [isUpdatingLoanTermFromPayment, setIsUpdatingLoanTermFromPayment] = useState(false);
  const [isUpdatingPaymentFromLoanTerm, setIsUpdatingPaymentFromLoanTerm] = useState(false);

  // This effect updates the loan term when monthly payment changes
  useEffect(() => {
    // Skip if there's no monthly payment value or if we're in the middle of calculations
    if (!formValues.monthlyPayment || isUpdatingLoanTermFromPayment) return;
    
    // Mark that we're updating to prevent circular updates
    setIsUpdatingLoanTermFromPayment(true);
    
    // Calculate the new loan term based on monthly payment
    const newLoanTerm = calculateLoanTermFromMonthlyPayment(
      formValues.propertyValue,
      formValues.downPaymentPercent,
      formValues.monthlyPayment,
      formValues.interestRate
    );
    
    // Update the loan term in the form
    setValue('loanTerm', newLoanTerm);
    
    // Release the update flag after a small delay to ensure state updates have completed
    setTimeout(() => {
      setIsUpdatingLoanTermFromPayment(false);
    }, 10);
  }, [formValues.monthlyPayment, formValues.propertyValue, formValues.downPaymentPercent, formValues.interestRate, setValue]);

  // This effect updates the monthly payment when loan term changes
  useEffect(() => {
    // Skip if we're currently updating the loan term from payment or already updating payment from term
    if (isUpdatingLoanTermFromPayment || isUpdatingPaymentFromLoanTerm) return;
    
    // Mark that we're updating to prevent circular updates
    setIsUpdatingPaymentFromLoanTerm(true);
    
    // Calculate the new mortgage details with the updated loan term
    const calculationResults = calculateMortgage(
      formValues.propertyValue,
      formValues.downPaymentPercent,
      formValues.loanTerm,
      formValues.interestRate
    );
    
    // Update the monthly payment in the form
    setValue('monthlyPayment', Math.round(calculationResults.monthlyPayment));
    
    // Release the update flag after a small delay
    setTimeout(() => {
      setIsUpdatingPaymentFromLoanTerm(false);
    }, 10);
  }, [formValues.loanTerm, formValues.propertyValue, formValues.downPaymentPercent, formValues.interestRate, setValue, isUpdatingLoanTermFromPayment]);

  useEffect(() => {
    // Skip calculation during updates to prevent loops
    if (isUpdatingLoanTermFromPayment || isUpdatingPaymentFromLoanTerm) return;
    
    const calculationResults = calculateMortgage(
      formValues.propertyValue,
      formValues.downPaymentPercent,
      formValues.loanTerm,
      formValues.interestRate
    );
    setResults(calculationResults);
  }, [formValues.propertyValue, formValues.downPaymentPercent, formValues.loanTerm, formValues.interestRate, isUpdatingLoanTermFromPayment, isUpdatingPaymentFromLoanTerm]);

  // Handle bank offer selection
  const handleSelectBankOffer = (offer) => {
    setValue('nbpBaseRate', offer.baseRateValue);
    setValue('bankMargin', offer.margin);
  };
  
  // Handle base rate selection (only update base rate)
  const handleSelectBaseRate = (offer) => {
    setValue('nbpBaseRate', offer.baseRateValue);
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
          <MortgageForm control={control} totalInterestRate={totalInterestRate} />
        </div>
        <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
          <ResultsDisplay results={results} />
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mt-8" style={{ backgroundColor: 'var(--color-white)' }}>
        <BankOffersTable 
          onSelectBankOffer={handleSelectBankOffer}
          onSelectBaseRate={handleSelectBaseRate}
        />
      </div>
    </div>
  );
};

export default MortgageCalculator;