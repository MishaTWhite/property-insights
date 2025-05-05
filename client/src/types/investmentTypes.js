/**
 * @typedef {Object} ProjectionInput
 * @property {number} startingAge - Age at which investment begins
 * @property {number} initialCapital - Initial investment amount
 * @property {number} monthlyInvestment - Monthly contribution amount
 * @property {number} annualReturn - Expected annual return percentage
 * @property {number} annualInflation - Expected annual inflation percentage
 * @property {number} endCapitalFormationAge - Age at which to stop making new contributions
 * @property {boolean} considerInflation - Whether to adjust for inflation
 * @property {boolean} reinvestAfterFormation - Whether to reinvest returns after formation period
 */

/**
 * @typedef {Object} ProjectionResult
 * @property {number} age - Age for this projection year
 * @property {number} capitalStart - Capital at the beginning of the year
 * @property {number} yearlyInvestment - Total invested during this year
 * @property {number} interestGained - Interest/returns earned this year
 * @property {number} capitalEnd - Capital at the end of the year
 * @property {number} passiveIncomeMonthly - Monthly passive income based on current capital
 * @property {number|null} passiveIncomeInflationAdjusted - Inflation-adjusted monthly passive income (null if inflation not considered)
 */

export {};