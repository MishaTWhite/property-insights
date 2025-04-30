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