import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateProjection, calculateTotalInvested } from '../utils/investmentCalculations';

// Debounce function to avoid excessive calculations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const InvestmentCalculator = () => {
  const { register, watch, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      startingAge: 30,
      initialCapital: 10000,
      monthlyInvestment: 1000,
      annualReturn: 7,
      annualInflation: 2.5,
      endCapitalFormationAge: 45,
      considerInflation: true,
      reinvestAfterFormation: true
    }
  });

  const [projections, setProjections] = useState(null);
  const [calculationError, setCalculationError] = useState(null);
  const formValues = watch();

  // Generate projection with proper error handling
  const generateProjectionSafely = (data) => {
    try {
      // Ensure all numeric inputs are properly coerced to numbers
      const parsedData = {
        startingAge: Number(data.startingAge),
        initialCapital: Number(data.initialCapital),
        monthlyInvestment: Number(data.monthlyInvestment),
        annualReturn: Number(data.annualReturn),
        annualInflation: Number(data.annualInflation),
        endCapitalFormationAge: Number(data.endCapitalFormationAge),
        considerInflation: Boolean(data.considerInflation),
        reinvestAfterFormation: Boolean(data.reinvestAfterFormation)
      };

      const results = generateProjection(parsedData);
      setProjections(results);
      setCalculationError(null);
    } catch (error) {
      console.error("Calculation error:", error);
      setCalculationError(error.message || "An error occurred during calculation");
      setProjections(null);
    }
  };

  // Debounced calculation function
  const debouncedCalculate = debounce((data) => {
    generateProjectionSafely(data);
  }, 200);

  // Use useEffect to watch form changes and trigger calculations
  useEffect(() => {
    const subscription = watch((value) => {
      debouncedCalculate(value);
    });
    
    // Run initial calculation
    debouncedCalculate(formValues);
    
    return () => subscription.unsubscribe();
  }, [watch]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data with appropriate visualization for accumulation vs post-accumulation
  const prepareChartData = (projections) => {
    if (!projections) return [];
    
    return projections.map(year => ({
      age: year.age,
      capital: year.capitalEnd,
      // Mark whether this is in formation period or post-formation
      isFormationPeriod: year.age <= formValues.endCapitalFormationAge
    }));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <form className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="form-group">
            <label className="block text-gray-700 mb-2">Starting Age</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("startingAge", { required: true, min: 18, max: 80 })}
            />
            {errors.startingAge && <span className="text-red-500 text-sm">Starting age is required (18-80)</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">Initial Capital (PLN)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("initialCapital", { required: true, min: 0 })}
            />
            {errors.initialCapital && <span className="text-red-500 text-sm">Initial capital is required</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">Monthly Investment (PLN)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("monthlyInvestment", { required: true, min: 0 })}
            />
            {errors.monthlyInvestment && <span className="text-red-500 text-sm">Monthly investment is required</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">Annual Return (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("annualReturn", { required: true, min: 0, max: 30 })}
            />
            {errors.annualReturn && <span className="text-red-500 text-sm">Annual return is required (0-30%)</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">Annual Inflation (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("annualInflation", { required: true, min: 0, max: 20 })}
            />
            {errors.annualInflation && <span className="text-red-500 text-sm">Annual inflation is required (0-20%)</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">End Capital Formation Age</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("endCapitalFormationAge", { 
                required: true, 
                min: Number(formValues.startingAge || 18), 
                max: 65 
              })}
            />
            {errors.endCapitalFormationAge && <span className="text-red-500 text-sm">End age is required (starting age to 65)</span>}
          </div>

          <div className="form-group col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  {...register("considerInflation")}
                />
                <label className="text-gray-700">Consider Inflation</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  {...register("reinvestAfterFormation")}
                />
                <label className="text-gray-700">Reinvest Income After Formation</label>
              </div>
            </div>
          </div>
        </div>
      </form>

      {calculationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {calculationError}
        </div>
      )}

      {projections && (
        <div>
          {/* Summary Section */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Investment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-600">Total Invested</div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(calculateTotalInvested(projections) + Number(formValues.initialCapital))}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Final Capital</div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(projections[projections.length - 1].capitalEnd)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Monthly Passive Income</div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(projections[projections.length - 1].passiveIncomeMonthly)}
                </div>
                {formValues.considerInflation && (
                  <div className="text-sm text-gray-500">
                    Inflation Adjusted: {formatCurrency(projections[projections.length - 1].passiveIncomeInflationAdjusted)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Capital Growth Projection</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={prepareChartData(projections)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="age"
                    label={{ value: 'Age', position: 'insideBottomRight', offset: 0 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Capital (PLN)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Capital"]} 
                    labelFormatter={(age) => `Age: ${age}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="capital" 
                    name="Capital" 
                    stroke="#4299E1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                    // Use a dashed line for the post-formation period
                    strokeDasharray={(data) => data.isFormationPeriod ? "0" : "5 5"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Yearly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starting Capital</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ending Capital</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Income</th>
                    {formValues.considerInflation && (
                      <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inflation Adj. Income</th>
                    )}
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projections.map((year, index) => (
                    <tr 
                      key={year.age}
                      className={year.age > formValues.endCapitalFormationAge ? "bg-gray-50" : ""}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {year.age}
                        {year.warning && (
                          <span className="ml-1 text-yellow-500" title={year.warning}>⚠️</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(year.capitalStart)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(year.yearlyInvestment)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(year.interestGained)}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-medium">{formatCurrency(year.capitalEnd)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(year.passiveIncomeMonthly)}</td>
                      {formValues.considerInflation && (
                        <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(year.passiveIncomeInflationAdjusted)}</td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap">
                        {year.warning ? (
                          <span className="text-yellow-500 flex items-center" title={year.warning}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Value Capped
                          </span>
                        ) : (
                          <span className="text-green-500">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentCalculator;