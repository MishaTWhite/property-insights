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
 * @returns {Array} Array of yearly projections, possibly with warning flags
 * @throws {Error} If input parameters are invalid
 */
export const generateProjection = (params) => {
  // Input validation
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

  // Validate input ranges and relationships
  if (annualReturn > 50) {
    throw new Error("Annual return exceeding 50% is unrealistic");
  }
  
  if (annualInflation > 30) {
    throw new Error("Annual inflation exceeding 30% is extreme");
  }
  
  // Removed validation for startingAge > endCapitalFormationAge since we handle this in the component
  
  // Constants and caps
  const MAX_INVESTMENT_MULTIPLIER = 4; // Cap growth at 4x the initial monthly investment
  const MAX_INFLATION_FACTOR = 20; // Cap cumulative inflation factor
  const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 1000; // Avoid getting too close to MAX_SAFE_INTEGER
  
  const yearlyProjections = [];
  let currentCapital = ensureSafeNumber(initialCapital);
  let currentMonthlyInvestment = ensureSafeNumber(monthlyInvestment);
  const originalMonthlyInvestment = currentMonthlyInvestment; // Keep track of initial value for capping
  const returnRate = ensureSafeNumber(annualReturn / 100);
  const inflationRate = ensureSafeNumber(annualInflation / 100);
  
  // Calculate max age needed for projections (endCapitalFormationAge + 20)
  const maxAge = endCapitalFormationAge + 20;
  
  // Loop through all years in the projection period
  for (let age = startingAge; age <= maxAge; age++) {
    // Track if this year's projections have any stability issues
    let hasWarning = false;
    
    const inFormationPeriod = age <= endCapitalFormationAge;
    const yearlyInvestment = inFormationPeriod ? ensureSafeNumber(currentMonthlyInvestment * 12) : 0;
    
    let interestGained;
    let capitalEnd;
    
    if (inFormationPeriod || reinvestAfterFormation) {
      // Calculate interest (assuming investments are made throughout the year)
      interestGained = ensureSafeNumber((currentCapital + yearlyInvestment / 2) * returnRate);
      // Add interest and new investments to capital
      capitalEnd = ensureSafeNumber(currentCapital + interestGained + yearlyInvestment);
    } else {
      // Non-reinvestment mode: calculate interest but don't add it to capital
      interestGained = ensureSafeNumber(currentCapital * returnRate);
      
      // Capital remains unchanged - interest is not reinvested but also not withdrawn
      // This is the correct behavior when "Reinvest Income After Formation" is disabled
      capitalEnd = currentCapital;
    }
    
    // Calculate monthly passive income
    let passiveIncomeMonthly = ensureSafeNumber(currentCapital * returnRate / 12);
    
    // Calculate inflation adjusted income if needed
    let passiveIncomeInflationAdjusted = null;
    if (considerInflation) {
      // Calculate inflation factor with a safety cap
      const yearsSinceStart = age - startingAge;
      // Cap the cumulative inflation factor to avoid extreme values
      let cumulativeInflationFactor = Math.pow(1 + inflationRate, yearsSinceStart);
      if (cumulativeInflationFactor > MAX_INFLATION_FACTOR) {
        cumulativeInflationFactor = MAX_INFLATION_FACTOR;
        hasWarning = true;
      }
      cumulativeInflationFactor = ensureSafeNumber(cumulativeInflationFactor);
      
      // Ensure we don't divide by zero or a very small number
      if (cumulativeInflationFactor < 0.0001) {
        cumulativeInflationFactor = 0.0001;
        hasWarning = true;
      }
      
      passiveIncomeInflationAdjusted = ensureSafeNumber(passiveIncomeMonthly / cumulativeInflationFactor);
    }
    
    // Cap values if they exceed safe limits
    if (capitalEnd > MAX_SAFE_VALUE) {
      capitalEnd = MAX_SAFE_VALUE;
      hasWarning = true;
    }
    
    if (passiveIncomeMonthly > MAX_SAFE_VALUE) {
      passiveIncomeMonthly = MAX_SAFE_VALUE;
      hasWarning = true;
    }
    
    if (passiveIncomeInflationAdjusted && passiveIncomeInflationAdjusted > MAX_SAFE_VALUE) {
      passiveIncomeInflationAdjusted = MAX_SAFE_VALUE;
      hasWarning = true;
    }
    
    // Record this year's projection
    yearlyProjections.push({
      age,
      capitalStart: currentCapital,
      yearlyInvestment,
      interestGained,
      capitalEnd,
      passiveIncomeMonthly,
      passiveIncomeInflationAdjusted,
      // Add warning flag if any values were capped or adjusted for stability
      ...(hasWarning && { warning: "Some values were capped for stability" })
    });
    
    // Update for next iteration
    currentCapital = capitalEnd;
    
    // If inflation is enabled, increase monthly investment for next year
    if (considerInflation && inFormationPeriod) {
      // Apply inflation increase but cap the growth
      currentMonthlyInvestment *= (1 + inflationRate);
      
      // Cap the monthly investment growth
      const maxAllowedInvestment = originalMonthlyInvestment * MAX_INVESTMENT_MULTIPLIER;
      if (currentMonthlyInvestment > maxAllowedInvestment) {
        currentMonthlyInvestment = maxAllowedInvestment;
      }
      
      currentMonthlyInvestment = ensureSafeNumber(currentMonthlyInvestment);
    }
  }
  
  return yearlyProjections;
};

/**
 * Ensures a number is finite and not NaN; returns 0 if the value is problematic
 * @param {number} value - The number to check
 * @returns {number} The value if it's finite, otherwise 0
 */
function ensureSafeNumber(value) {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return value;
}

/**
 * Calculate total amount invested over time
 * @param {Array} projections - Array of yearly projections
 * @returns {number} Total amount invested
 */
export const calculateTotalInvested = (projections) => {
  return projections.reduce((sum, year) => sum + year.yearlyInvestment, 0);
};