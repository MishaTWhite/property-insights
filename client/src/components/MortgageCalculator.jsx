import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import MortgageForm from './MortgageForm';
import ResultsDisplay from './ResultsDisplay';
import { calculateMortgage } from '../utils/mortgageCalculations';

const MortgageCalculator = ({ defaultInterestRate }) => {
  const { control, watch, setValue } = useForm({
    defaultValues: {
      propertyValue: 500000,
      downPaymentPercent: 20,
      loanTerm: 25,
      interestRate: defaultInterestRate,
    },
  });

  const formValues = watch();
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Update interest rate if defaultInterestRate changes
    setValue('interestRate', defaultInterestRate);
  }, [defaultInterestRate, setValue]);

  useEffect(() => {
    const calculationResults = calculateMortgage(
      formValues.propertyValue,
      formValues.downPaymentPercent,
      formValues.loanTerm,
      formValues.interestRate
    );
    setResults(calculationResults);
  }, [formValues.propertyValue, formValues.downPaymentPercent, formValues.loanTerm, formValues.interestRate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
        <MortgageForm control={control} />
      </div>
      <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
        <ResultsDisplay results={results} />
      </div>
    </div>
  );
};

export default MortgageCalculator;