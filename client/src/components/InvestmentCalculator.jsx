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
    
    // Safely format values with null checks
    const formatNumberSafely = (value) => {
      if (value === undefined || value === null) return 'N/A';
      return value.toLocaleString('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };
    
    return (
      <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-md rounded">
        <p className="font-semibold mb-1">{`Age: ${label}`}</p>
        <p className="text-sm">{`Capital: ${formatNumberSafely(payload[0]?.value)}`}</p>
        
        {hoveredYear?.passiveIncomeMonthly !== undefined && (
          <p className="text-sm mt-2 font-semibold text-blue-700">
            {`Monthly Income: ${formatNumberSafely(hoveredYear.passiveIncomeMonthly)}`}
          </p>
        )}
        
        {considerInflation && hoveredYear?.passiveIncomeInflationAdjusted !== undefined && (
          <p className="text-sm text-green-700">
            {`Inflation Adjusted Income: ${formatNumberSafely(hoveredYear.passiveIncomeInflationAdjusted)}`}
          </p>
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
  const [chartView, setChartView] = useState('capital'); // 'capital' or 'income'
  const [hoveredAge, setHoveredAge] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    settings: false,
    summary: window.innerWidth < 768,
    chart: window.innerWidth < 768,
    table: window.innerWidth < 768
  });
  const formValues = watch();

  // Generate projection with proper error handling
  const generateProjectionSafely = (data) => {
    try {
      // Validate age inputs before proceeding
      const startingAge = Number(data.startingAge);
      const endCapitalFormationAge = Number(data.endCapitalFormationAge);
      const initialCapital = Number(data.initialCapital);
      const monthlyInvestment = Number(data.monthlyInvestment);
      const annualReturn = Number(data.annualReturn);
      const annualInflation = Number(data.annualInflation);

      // Enhanced validation - check for all required inputs and valid relationships
      if (isNaN(startingAge) || startingAge <= 0 || 
          isNaN(endCapitalFormationAge) || endCapitalFormationAge <= 0 ||
          isNaN(initialCapital) || 
          isNaN(monthlyInvestment) ||
          isNaN(annualReturn) ||
          isNaN(annualInflation) ||
          endCapitalFormationAge < startingAge) {
        // Silently skip chart rendering without crashing
        setCalculationError(null);
        setProjections(null);
        return;
      }

      // Ensure all numeric inputs are properly coerced to numbers
      const parsedData = {
        startingAge: startingAge,
        initialCapital: initialCapital,
        monthlyInvestment: monthlyInvestment,
        annualReturn: annualReturn,
        annualInflation: annualInflation,
        endCapitalFormationAge: endCapitalFormationAge,
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
      // Add pre-validation before calling debounced function
      const startingAge = Number(value.startingAge);
      const endCapitalFormationAge = Number(value.endCapitalFormationAge);
      
      // Only call calculation if basic validation passes
      if (!isNaN(startingAge) && !isNaN(endCapitalFormationAge) && 
          startingAge > 0 && endCapitalFormationAge > 0) {
        debouncedCalculate(value);
      } else {
        // Clear projections if inputs are invalid
        setProjections(null);
        setCalculationError(null);
      }
    });
    
    // Run initial calculation with validation
    if (
      !isNaN(Number(formValues.startingAge)) && 
      !isNaN(Number(formValues.endCapitalFormationAge)) && 
      Number(formValues.startingAge) > 0 && 
      Number(formValues.endCapitalFormationAge) > 0
    ) {
      debouncedCalculate(formValues);
    }
    
    return () => subscription.unsubscribe();
  }, [watch]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Helper function for safely getting a projection at a specific age
  const getProjectionAtAge = (age) => {
    if (!projections) return null;
    return projections.find(p => p.age === age) || null;
  };

  // Prepare chart data with appropriate visualization for accumulation vs post-accumulation
  const prepareChartData = (projections) => {
    if (!projections) return [];
    
    // Calculate upper age limit dynamically (endCapitalFormationAge + 20)
    const upperAgeLimit = Number(formValues.endCapitalFormationAge) + 20;
    
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
      {/* Main container with flex layout - responsive sidebar design */}
      <div className="flex flex-col md:flex-row md:gap-6">
        {/* Left column - Sidebar with Investment Settings (fixed width on desktop) */}
        <div className="w-full md:min-w-[280px] md:w-full md:max-w-[300px] mb-6 md:mb-0">
          <form className="bg-gray-50 p-4 rounded-lg h-full">
            <h2 className="text-xl font-bold mb-4">Investment Settings</h2>
            <div className="grid grid-cols-1 gap-5">
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
                <label className="block text-gray-700 mb-2">Initial Capital</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("initialCapital", { required: true, min: 0 })}
                />
                {errors.initialCapital && <span className="text-red-500 text-sm">Initial capital is required</span>}
              </div>

              <div className="form-group">
                <label className="block text-gray-700 mb-2">Monthly Investment</label>
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

        {/* Right column - Results section (takes remaining space) */}
        <div className="w-full flex-1">
          {calculationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong>Error:</strong> {calculationError}
            </div>
          )}

          {projections && (
            <div>
              {/* Summary Section with collapsible header for mobile and sticky position for desktop */}
              <div className={`bg-gray-100 p-4 rounded-lg mb-6 lg:sticky lg:top-4 z-10 ${collapsedSections.summary ? 'border-b border-gray-300' : ''}`}>
                <div 
                  className="flex justify-between items-center cursor-pointer md:cursor-default" 
                  onClick={() => window.innerWidth < 768 && setCollapsedSections({...collapsedSections, summary: !collapsedSections.summary})}
                >
                  <h2 className="text-xl font-bold mb-4">Investment Summary</h2>
                  {window.innerWidth < 768 && (
                    <button className="text-gray-500 focus:outline-none">
                      {collapsedSections.summary ? '➕' : '➖'}
                    </button>
                  )}
                </div>
                
                {(!collapsedSections.summary || window.innerWidth >= 768) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-600">Total Invested</div>
                      <div className="text-2xl font-semibold">
                        {projections ? formatCurrency(calculateTotalInvested(projections) + Number(formValues.initialCapital)) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Capital</div>
                      <div className="text-2xl font-semibold">
                        {(() => {
                          const finalProjection = getProjectionAtAge(Number(formValues.endCapitalFormationAge));
                          return finalProjection ? formatCurrency(finalProjection.capitalEnd) : 'N/A';
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Monthly Passive Income</div>
                      <div className="text-2xl font-semibold">
                        {(() => {
                          const finalProjection = getProjectionAtAge(Number(formValues.endCapitalFormationAge));
                          if (!finalProjection) return 'N/A';
                          
                          return (
                            <>
                              {formatCurrency(finalProjection.passiveIncomeMonthly)}
                            </>
                          );
                        })()}
                      </div>
                      {formValues.considerInflation && (() => {
                        const finalProjection = getProjectionAtAge(Number(formValues.endCapitalFormationAge));
                        if (!finalProjection) return null;
                        
                        return (
                          <div className="text-sm text-gray-500">
                            Inflation Adjusted: {formatCurrency(finalProjection.passiveIncomeInflationAdjusted)}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Section with collapsible header and view toggle */}
              <div className={`mb-8 ${collapsedSections.chart ? 'border-b border-gray-300' : ''}`}>
                <div 
                  className="flex justify-between items-center cursor-pointer md:cursor-default mb-4" 
                  onClick={() => window.innerWidth < 768 && setCollapsedSections({...collapsedSections, chart: !collapsedSections.chart})}
                >
                  <h2 className="text-xl font-bold">
                    {chartView === 'capital' ? 'Capital Growth Projection' : 'Monthly Passive Income Projection'}
                  </h2>
                  <div className="flex items-center">
                    <div className="hidden md:flex mr-4">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="chartView"
                          value="capital"
                          className="form-radio h-4 w-4 text-blue-600"
                          checked={chartView === 'capital'}
                          onChange={() => setChartView('capital')}
                        />
                        <span className="ml-2 text-gray-700">Capital</span>
                      </label>
                      <label className="inline-flex items-center ml-4 cursor-pointer">
                        <input
                          type="radio"
                          name="chartView"
                          value="income"
                          className="form-radio h-4 w-4 text-blue-600"
                          checked={chartView === 'income'}
                          onChange={() => setChartView('income')}
                        />
                        <span className="ml-2 text-gray-700">Monthly Income</span>
                      </label>
                    </div>
                    {window.innerWidth < 768 && (
                      <button className="text-gray-500 focus:outline-none">
                        {collapsedSections.chart ? '➕' : '➖'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile-only chart view switcher */}
                {window.innerWidth < 768 && !collapsedSections.chart && (
                  <div className="flex justify-center mb-4">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                      <button 
                        type="button" 
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                          chartView === 'capital' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setChartView('capital')}
                      >
                        Capital
                      </button>
                      <button 
                        type="button" 
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                          chartView === 'income' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setChartView('income')}
                      >
                        Monthly Income
                      </button>
                    </div>
                  </div>
                )}
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
                          key={`chart-${formValues.startingAge}-${formValues.endCapitalFormationAge}-${chartData.length}-${chartView}`}
                          onMouseMove={(e) => {
                            if (e && e.activePayload && e.activePayload[0]) {
                              const age = e.activePayload[0].payload.age;
                              setHoveredAge(age);
                            }
                          }}
                          onMouseLeave={() => setHoveredAge(null)}
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
                            label={{ value: chartView === 'capital' ? 'Capital' : 'Monthly Income', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            content={<CustomTooltip considerInflation={formValues.considerInflation} />}
                          />
                          <Legend />
                          
                          {/* Formation period - solid line */}
                          <Line 
                            data={formation}
                            type="monotone" 
                            dataKey={chartView === 'capital' ? 'capital' : 'passiveIncomeMonthly'} 
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
                              dataKey={chartView === 'capital' ? 'capital' : 'passiveIncomeMonthly'} 
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
                                dataKey={chartView === 'capital' ? 'capitalInflationAdjusted' : 'passiveIncomeInflationAdjusted'} 
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
                                  dataKey={chartView === 'capital' ? 'capitalInflationAdjusted' : 'passiveIncomeInflationAdjusted'} 
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

              {/* Table Section - with improved mobile responsiveness */}
              <div>
                <h2 className="text-xl font-bold mb-4">Yearly Breakdown</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                      {projections
                        .filter(year => year.age <= Number(formValues.endCapitalFormationAge) + 1)
                        .map((year) => (
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