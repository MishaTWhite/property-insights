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

// Custom tooltip component to show monthly income information
const CustomTooltip = ({ active, payload, label, considerInflation }) => {
  if (active && payload && payload.length) {
    // Find the year data for this age in projections
    const hoveredYear = payload[0].payload;
    
    return (
      <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-md rounded">
        <p className="font-semibold mb-1">{`Age: ${label}`}</p>
        <p className="text-sm">{`Capital: ${payload[0].value.toLocaleString('en-US', {
          style: 'currency',
          currency: 'PLN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`}</p>
        
        <p className="text-sm mt-2 font-semibold text-blue-700">{`Monthly Income: ${hoveredYear.passiveIncomeMonthly.toLocaleString('en-US', {
          style: 'currency',
          currency: 'PLN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`}</p>
        
        {considerInflation && (
          <p className="text-sm text-green-700">{`Inflation Adjusted Income: ${hoveredYear.passiveIncomeInflationAdjusted.toLocaleString('en-US', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}</p>
        )}
      </div>
    );
  }

  return null;
};

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
    
    // Calculate upper age limit according to requirements
    const upperAgeLimit = Math.min(65, Number(formValues.endCapitalFormationAge) + 25);
    
    // Filter projections to avoid duplicated years and limit to valid range
    const filteredProjections = projections.filter(year => {
      return year.age <= upperAgeLimit;
    });
    
    // Ensure we have unique age values (defensive check)
    const uniqueAges = new Set();
    const uniqueProjections = filteredProjections.filter(year => {
      if (uniqueAges.has(year.age)) {
        console.warn(`Duplicate age value detected: ${year.age}`);
        return false;
      }
      uniqueAges.add(year.age);
      return true;
    });
    
    // Log chart data range for debugging
    if (uniqueProjections.length > 0) {
      console.log(`Chart data range: ${uniqueProjections[0].age} to ${uniqueProjections[uniqueProjections.length - 1].age}`);
      console.log(`Total data points: ${uniqueProjections.length}`);
    }
    
    return uniqueProjections.map((year) => {
      // Calculate inflation-adjusted capital if inflation is considered
      let capitalInflationAdjusted = null;
      if (formValues.considerInflation) {
        const yearsSinceStart = year.age - projections[0].age;
        const inflationFactor = Math.pow(1 + formValues.annualInflation / 100, yearsSinceStart);
        capitalInflationAdjusted = year.capitalEnd / inflationFactor;
      }
      
      return {
        age: year.age,
        capital: year.capitalEnd,
        capitalInflationAdjusted,
        // Mark whether this is in formation period or post-formation
        isFormationPeriod: year.age <= formValues.endCapitalFormationAge,
        isPostFormation: year.age > formValues.endCapitalFormationAge,
        // Add monthly income values for the tooltip
        passiveIncomeMonthly: year.passiveIncomeMonthly,
        passiveIncomeInflationAdjusted: year.passiveIncomeInflationAdjusted
      };
    });
  };

  // Split the data into formation and post-formation periods
  const splitDataByFormationPeriod = (data) => {
    if (!data || data.length === 0) return { formation: [], postFormation: [] };
    
    const formation = data.filter(item => item.isFormationPeriod);
    const postFormation = data.filter(item => !item.isFormationPeriod);
    
    // Log the split data for debugging
    console.log(`Formation period data points: ${formation.length}`);
    console.log(`Post-formation period data points: ${postFormation.length}`);
    
    // If there are both formation and post-formation data points, ensure continuity
    if (formation.length > 0 && postFormation.length > 0) {
      // Find the last formation age and first post-formation age
      const lastFormationAge = formation[formation.length - 1].age;
      const firstPostFormationAge = postFormation[0].age;
      
      // Check if there's a gap between the periods
      if (firstPostFormationAge - lastFormationAge > 1) {
        console.warn(`Gap detected between formation and post-formation periods: ${lastFormationAge} to ${firstPostFormationAge}`);
      }
    }
    
    return { formation, postFormation };
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Main container with flex layout */}
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left column - Form section (30-35% width) */}
        <div className="w-full md:w-1/3 mb-6 md:mb-0">
          <form>
            <h2 className="text-xl font-bold mb-4">Investment Settings</h2>
            <div className="grid grid-cols-1 gap-4">
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

              <div className="form-group">
                <div className="flex flex-col space-y-2">
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
        </div>

        {/* Right column - Results section (65-70% width) */}
        <div className="w-full md:w-2/3">
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
                    {/* Extract data preparation outside JSX */}
                    {(() => {
                      const chartData = prepareChartData(projections);
                      const { formation, postFormation } = splitDataByFormationPeriod(chartData);
                      
                      return (
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          key={`chart-${formValues.startingAge}-${formValues.endCapitalFormationAge}-${chartData.length}`}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="age"
                            label={{ value: 'Age', position: 'insideBottomRight', offset: 0 }}
                            domain={[formValues.startingAge, Math.min(65, Number(formValues.endCapitalFormationAge) + 20)]}
                            allowDuplicatedCategory={false}
                            type="number"
                          />
                          <YAxis 
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            label={{ value: 'Capital (PLN)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            content={<CustomTooltip considerInflation={formValues.considerInflation} />}
                          />
                          <Legend />
                          
                          {/* Formation period - solid line */}
                          <Line 
                            data={formation}
                            type="monotone" 
                            dataKey="capital" 
                            name="Nominal Value (Formation)" 
                            stroke="#4299E1"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 8 }}
                            connectNulls
                          />
                          
                          {/* Post-formation period - dashed line */}
                          {postFormation.length > 0 && (
                            <Line 
                              data={postFormation}
                              type="monotone" 
                              dataKey="capital" 
                              name="Nominal Value (Post-Formation)" 
                              stroke="#4299E1"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              dot={false}
                              activeDot={{ r: 8 }}
                              connectNulls
                            />
                          )}
                          
                          {/* If inflation is considered, add the inflation-adjusted lines */}
                          {formValues.considerInflation && (
                            <>
                              {/* Formation period - solid line */}
                              <Line 
                                data={formation}
                                type="monotone" 
                                dataKey="capitalInflationAdjusted" 
                                name="Real Value (Formation)" 
                                stroke="#48BB78"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 8 }}
                                connectNulls
                              />
                              
                              {/* Post-formation period - dashed line */}
                              {postFormation.length > 0 && (
                                <Line 
                                  data={postFormation}
                                  type="monotone" 
                                  dataKey="capitalInflationAdjusted" 
                                  name="Real Value (Post-Formation)" 
                                  stroke="#48BB78"
                                  strokeWidth={2}
                                  strokeDasharray="4 4"
                                  dot={false}
                                  activeDot={{ r: 8 }}
                                  connectNulls
                                />
                              )}
                            </>
                          )}
                        </LineChart>
                      );
                    })()}
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projections.map((year) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;