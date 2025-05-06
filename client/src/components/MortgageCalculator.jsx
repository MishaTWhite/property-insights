import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import MortgageForm from './MortgageForm';
import ResultsDisplay from './ResultsDisplay';
import AcceleratedRepaymentPanel from './AcceleratedRepaymentPanel';
import HowItWorksExplanation from './HowItWorksExplanation';
import CurrencySwitcher from './CurrencySwitcher';
import { calculateMortgage, calculateLoanTermFromMonthlyPayment } from '../utils/mortgageCalculations';
import { useCurrency } from '../context/CurrencyContext';
import { useLoanTermPreservation } from '../hooks/useLoanTermPreservation';
import useBankOffers from '../hooks/useBankOffers';

const MortgageCalculator = ({ defaultInterestRate }) => {
  const { currency } = useCurrency();
  const { baseRate } = useBankOffers(); // Получаем фиксированное значение WIBOR = 5.41
  
  const { control, watch, setValue } = useForm({
    defaultValues: {
      propertyValue: 500000,
      downPaymentPercent: 20,
      loanTerm: 30,
      monthlyPayment: 2229,
      nbpBaseRate: baseRate, // Используем фиксированное значение WIBOR = 5.41
      bankMargin: 2.20,  // Default Bank Margin - изменено с 2.10 на 2.20
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
  
  // Track currency changes to preserve loan term and monthly payment position
  const { isCurrencyChanged, DEFAULT_LOAN_TERM } = useLoanTermPreservation(control, setValue);
  const [lastCurrency, setLastCurrency] = useState(currency);
  const [lastPropertyValue, setLastPropertyValue] = useState(formValues.propertyValue);
  
  // Track if the user has manually changed the loan term
  const [userChangedTerm, setUserChangedTerm] = useState(false);
  
  // Track if the user has manually changed the payment with the slider
  const [userChangedPayment, setUserChangedPayment] = useState(false);
  
  // Track the relative position of the monthly payment slider (0-100%)
  const [paymentSliderPosition, setPaymentSliderPosition] = useState(50);
  
  // Listen for payment slider position change events from MortgageForm
  useEffect(() => {
    const handlePaymentSliderPositionChange = (event) => {
      setPaymentSliderPosition(event.detail.position);
      // Set the user changed payment flag when user adjusts the payment slider
      if (event.detail.userChangedPayment) {
        setUserChangedPayment(true);
      }
    };
    
    // Add the event listener
    window.addEventListener('paymentSliderPositionChange', handlePaymentSliderPositionChange);
    
    // Clean up
    return () => {
      window.removeEventListener('paymentSliderPositionChange', handlePaymentSliderPositionChange);
    };
  }, []);

  // This effect updates the loan term when monthly payment changes
  useEffect(() => {
    // Skip if there's no monthly payment value, if we're in the middle of calculations, 
    // or if user has NOT manually changed the payment (this is key)
    if (!formValues.monthlyPayment || isUpdatingLoanTermFromPayment || !userChangedPayment) return;
    
    // Check if currency has changed since last render
    const currencyHasChanged = currency !== lastCurrency;
    
    // If currency has changed, update the lastCurrency and skip recalculation
    if (currencyHasChanged) {
      setLastCurrency(currency);
      return;
    }
    
    // Mark that we're updating to prevent circular updates
    setIsUpdatingLoanTermFromPayment(true);
    
    // Mark that the user has manually changed the monthly payment
    setUserChangedTerm(false); // User is controlling payment, not term
    
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
  }, [formValues.monthlyPayment, formValues.interestRate, setValue, currency, lastCurrency, userChangedPayment]);

  // Calculate min/max monthly payment range based on loan terms
  const calculatePaymentRange = () => {
    // Calculate payment for minimum term (5 years)
    const minTermPayment = calculateMortgage(
      formValues.propertyValue,
      formValues.downPaymentPercent,
      5, // Min term
      formValues.interestRate
    ).monthlyPayment;
    
    // Calculate payment for maximum term (35 years)
    const maxTermPayment = calculateMortgage(
      formValues.propertyValue,
      formValues.downPaymentPercent,
      35, // Max term
      formValues.interestRate
    ).monthlyPayment;
    
    return { min: Math.round(maxTermPayment), max: Math.round(minTermPayment) };
  };
  
  // This effect handles currency changes and preserves the monthly payment slider position AND loan term
  useEffect(() => {
    // Check if currency has changed
    if (currency !== lastCurrency) {
      // Mark that we're updating to prevent other effects from running
      setIsUpdatingPaymentFromLoanTerm(true);
      
      // Important: Preserve the current loan term
      const currentLoanTerm = formValues.loanTerm;
      
      // Calculate the new monthly payment based on the preserved loan term
      const calculationResults = calculateMortgage(
        formValues.propertyValue,
        formValues.downPaymentPercent,
        currentLoanTerm,
        formValues.interestRate
      );
      
      // Update the monthly payment (preserving loan term)
      const newPayment = Math.round(calculationResults.monthlyPayment);
      setValue('monthlyPayment', newPayment);
      
      // Update the last currency
      setLastCurrency(currency);
      
      // Release the update flag after a small delay
      setTimeout(() => {
        setIsUpdatingPaymentFromLoanTerm(false);
      }, 10);
    }
  }, [currency, lastCurrency, formValues.propertyValue, formValues.downPaymentPercent, formValues.loanTerm, formValues.interestRate, setValue]);

  // Remove the effect that resets loan term when property value changes
  // Instead, just track the last property value for reference
  useEffect(() => {
    // Always update the last property value
    if (formValues.propertyValue !== lastPropertyValue) {
      setLastPropertyValue(formValues.propertyValue);
    }
  }, [formValues.propertyValue, lastPropertyValue]);

  // NEW EFFECT: Update monthly payment when property value or down payment changes
  useEffect(() => {
    // Skip if we're in the middle of other updates or if currency has just changed
    if (isUpdatingLoanTermFromPayment || isUpdatingPaymentFromLoanTerm || currency !== lastCurrency) return;
    
    // Also skip if user has manually changed the monthly payment (which would recalculate the loan term instead)
    if (!userChangedTerm) {
      // Mark that we're updating to prevent circular updates
      setIsUpdatingPaymentFromLoanTerm(true);
      
      // Calculate the new mortgage details with the current property value, down payment, and loan term
      const calculationResults = calculateMortgage(
        formValues.propertyValue,
        formValues.downPaymentPercent,
        formValues.loanTerm,
        formValues.interestRate
      );
      
      // Update the monthly payment in the form
      const newPayment = Math.round(calculationResults.monthlyPayment);
      setValue('monthlyPayment', newPayment);
      
      // Release the update flag after a small delay
      setTimeout(() => {
        setIsUpdatingPaymentFromLoanTerm(false);
      }, 10);
    }
  }, [formValues.propertyValue, formValues.downPaymentPercent, formValues.interestRate, userChangedTerm, currency, lastCurrency, setValue, formValues.loanTerm]);

  // This effect updates the monthly payment when loan term changes
  useEffect(() => {
    // Skip if we're currently updating the loan term from payment, already updating payment from term,
    // or if currency has just changed
    if (isUpdatingLoanTermFromPayment || isUpdatingPaymentFromLoanTerm || currency !== lastCurrency) return;
    
    // Mark that the user has manually changed the term
    setUserChangedTerm(true);
    
    // Reset userChangedPayment to false so we go back to standard calculation mode
    // (calculate monthly payment from loan term)
    setUserChangedPayment(false);
    
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
    const newPayment = Math.round(calculationResults.monthlyPayment);
    setValue('monthlyPayment', newPayment);
    
    // Calculate the payment range and update the slider position
    const paymentRange = calculatePaymentRange();
    if (paymentRange.max !== paymentRange.min) {
      const sliderPos = ((newPayment - paymentRange.min) / (paymentRange.max - paymentRange.min)) * 100;
      setPaymentSliderPosition(Math.max(0, Math.min(100, sliderPos)));
    }
    
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

  // Обработчики выбора банковских предложений удалены, так как блок оферов банков больше не используется

  return (
    <div className="flex flex-col">
      {/* Currency selector at top right */}
      <div className="flex justify-end mb-4">
        <CurrencySwitcher />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
          <MortgageForm control={control} totalInterestRate={totalInterestRate} setValue={setValue} />
        </div>
        <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)' }}>
          <ResultsDisplay results={results} />
        </div>
      </div>
      
      <div className="mt-8">
        <AcceleratedRepaymentPanel results={results} />
      </div>
      
      <HowItWorksExplanation />
    </div>
  );
};

export default MortgageCalculator;