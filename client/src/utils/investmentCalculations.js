/**
 * Generates a projection of investment growth over time
 * @param {Object} params - Investment parameters
 * @param {number} params.startingAge - Age at which investment begins
 * @param {number} params.initialCapital - Initial investment amount
 * @param {number} params.monthlyInvestment - Monthly contribution amount
 * @param {number} params.annualReturn - Expected annual return percentage
 * @param {number} params.annualInflation - Expected annual inflation percentage
 * @param {number} params.endCapitalFormationAge - Age at which to stop making new contributions
 * @param {boolean} params.considerInflation - Whether to adjust for inflation
 * @param {boolean} params.reinvestAfterFormation - Whether to reinvest returns after formation period
 * @returns {Array} Array of yearly projections
 */
export const generateProjection = (params) => {
  const {
    startingAge,
    initialCapital,
    monthlyInvestment,
    annualReturn,
    annualInflation,
    endCapitalFormationAge,
    considerInflation,
    reinvestAfterFormation
  } = params;

  const yearlyProjections = [];
  let currentCapital = initialCapital;
  let currentMonthlyInvestment = monthlyInvestment;
  const returnRate = annualReturn / 100;
  const inflationRate = annualInflation / 100;
  
  // Loop until age 65
  for (let age = startingAge; age <= 65; age++) {
    const inFormationPeriod = age <= endCapitalFormationAge;
    const yearlyInvestment = inFormationPeriod ? currentMonthlyInvestment * 12 : 0;
    
    let interestGained;
    let capitalEnd;
    
    if (inFormationPeriod || reinvestAfterFormation) {
      // Calculate interest (assuming investments are made throughout the year)
      interestGained = (currentCapital + yearlyInvestment / 2) * returnRate;
      // Add interest and new investments to capital
      capitalEnd = currentCapital + interestGained + yearlyInvestment;
    } else {
      // Withdrawal mode: don't reinvest interest
      interestGained = currentCapital * returnRate;
      // Only the principal remains (interest is withdrawn)
      capitalEnd = currentCapital;
    }
    
    // Calculate monthly passive income
    const passiveIncomeMonthly = currentCapital * returnRate / 12;
    
    // Calculate inflation adjusted income if needed
    let passiveIncomeInflationAdjusted = null;
    if (considerInflation) {
      // Adjust for cumulative inflation since start
      const cumulativeInflationFactor = Math.pow(1 + inflationRate, age - startingAge);
      passiveIncomeInflationAdjusted = passiveIncomeMonthly / cumulativeInflationFactor;
    }
    
    // Record this year's projection
    yearlyProjections.push({
      age,
      capitalStart: currentCapital,
      yearlyInvestment,
      interestGained,
      capitalEnd,
      passiveIncomeMonthly,
      passiveIncomeInflationAdjusted
    });
    
    // Update for next iteration
    currentCapital = capitalEnd;
    
    // If inflation is enabled, increase monthly investment for next year
    if (considerInflation && inFormationPeriod) {
      currentMonthlyInvestment *= (1 + inflationRate);
    }
  }
  
  return yearlyProjections;
};

/**
 * Calculate total amount invested over time
 * @param {Array} projections - Array of yearly projections
 * @returns {number} Total amount invested
 */
export const calculateTotalInvested = (projections) => {
  return projections.reduce((sum, year) => sum + year.yearlyInvestment, 0);
};