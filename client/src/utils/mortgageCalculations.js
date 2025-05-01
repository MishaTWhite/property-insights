/**
 * Calculate mortgage details
 * @param {number} propertyValue - The total value of the property
 * @param {number} downPaymentPercent - The down payment percentage
 * @param {number} loanTermYears - The loan term in years
 * @param {number} annualInterestRate - The annual interest rate (%)
 * @returns {Object} - Object containing mortgage calculation results
 */
export const calculateMortgage = (propertyValue, downPaymentPercent, loanTermYears, annualInterestRate) => {
  // Calculate down payment and loan amount
  const downPayment = propertyValue * (downPaymentPercent / 100);
  const loanAmount = propertyValue - downPayment;
  
  // Convert annual interest rate to monthly
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  
  // Calculate total number of payments
  const totalPayments = loanTermYears * 12;
  
  // Calculate monthly payment (annuity formula)
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  // where M is monthly payment, P is principal (loan amount),
  // r is monthly interest rate, n is total number of payments
  
  // Handle edge case where interest rate is 0
  let monthlyPayment;
  if (monthlyInterestRate === 0) {
    monthlyPayment = loanAmount / totalPayments;
  } else {
    const x = Math.pow(1 + monthlyInterestRate, totalPayments);
    monthlyPayment = (loanAmount * monthlyInterestRate * x) / (x - 1);
  }
  
  // Calculate total payment over the life of the loan
  const totalPayment = monthlyPayment * totalPayments;
  
  // Calculate total interest paid
  const totalInterest = totalPayment - loanAmount;
  
  // Calculate loan to value ratio
  const loanToValue = (loanAmount / propertyValue) * 100;
  
  // Return results
  return {
    propertyValue: propertyValue,
    downPayment: downPayment,
    loanAmount: loanAmount,
    monthlyPayment: monthlyPayment,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    loanTerm: loanTermYears,
    loanToValue: loanToValue,
    interestRate: annualInterestRate,
    // For the pie chart
    chartData: {
      labels: ['Principal', 'Interest'],
      datasets: [
        {
          data: [loanAmount, totalInterest],
          backgroundColor: ['#4f46e5', '#f59e0b'],
          hoverBackgroundColor: ['#4338ca', '#d97706'],
        },
      ],
    },
  };
};

/**
 * Calculate loan term based on monthly payment
 * @param {number} propertyValue - The total value of the property
 * @param {number} downPaymentPercent - The down payment percentage
 * @param {number} monthlyPayment - The desired monthly payment
 * @param {number} annualInterestRate - The annual interest rate (%)
 * @returns {number} - Loan term in years (rounded to nearest integer)
 */
export const calculateLoanTermFromMonthlyPayment = (propertyValue, downPaymentPercent, monthlyPayment, annualInterestRate) => {
  // Calculate down payment and loan amount
  const downPayment = propertyValue * (downPaymentPercent / 100);
  const loanAmount = propertyValue - downPayment;
  
  // Convert annual interest rate to monthly
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  
  // Handle edge cases
  if (monthlyPayment <= 0 || loanAmount <= 0) {
    return 30; // Default loan term
  }
  
  // Handle edge case where interest rate is 0
  if (monthlyInterestRate === 0) {
    const termMonths = loanAmount / monthlyPayment;
    return Math.round(termMonths / 12);
  }
  
  // Calculate loan term in months using the formula:
  // n = log(M / (M - P*r)) / log(1 + r)
  // where n is number of payments, M is monthly payment, 
  // P is principal (loan amount), r is monthly interest rate
  
  // Ensure monthly payment is sufficient to cover at least the interest
  const minPayment = loanAmount * monthlyInterestRate;
  if (monthlyPayment <= minPayment) {
    return 35; // Maximum loan term (or return a message that payment is too low)
  }
  
  const termMonths = Math.log(monthlyPayment / (monthlyPayment - loanAmount * monthlyInterestRate)) / 
                      Math.log(1 + monthlyInterestRate);
  
  // Round to nearest year and ensure within reasonable limits
  let termYears = Math.round(termMonths / 12);
  
  // Enforce min/max loan terms
  termYears = Math.min(Math.max(termYears, 5), 35);
  
  return termYears;
};

/**
 * Format number as currency (PLN)
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};