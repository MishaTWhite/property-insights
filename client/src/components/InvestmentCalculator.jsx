import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateProjection, calculateTotalInvested } from '../utils/investmentCalculations';

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
  const formValues = watch();

  // Generate projection when form is submitted
  const onSubmit = (data) => {
    const results = generateProjection(data);
    setProjections(results);
  };

  // Auto-calculate when any input changes
  const calculateResults = () => {
    handleSubmit(onSubmit)();
  };

  // Watch for changes to any input and recalculate
  useState(() => {
    calculateResults();
  }, [formValues.startingAge, formValues.initialCapital, formValues.monthlyInvestment, 
      formValues.annualReturn, formValues.annualInflation, formValues.endCapitalFormationAge,
      formValues.considerInflation, formValues.reinvestAfterFormation]);

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
      <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="form-group">
            <label className="block text-gray-700 mb-2">Starting Age</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("startingAge", { required: true, min: 18, max: 80 })}
              onChange={calculateResults}
            />
            {errors.startingAge && <span className="text-red-500 text-sm">Starting age is required (18-80)</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">Initial Capital (PLN)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("initialCapital", { required: true, min: 0 })}
              onChange={calculateResults}
            />
            {errors.initialCapital && <span className="text-red-500 text-sm">Initial capital is required</span>}
          </div>

          <div className="form-group">
            <label className="block text-gray-700 mb-2">Monthly Investment (PLN)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("monthlyInvestment", { required: true, min: 0 })}
              onChange={calculateResults}
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
              onChange={calculateResults}
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
              onChange={calculateResults}
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
              onChange={calculateResults}
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
                  onChange={calculateResults}
                />
                <label className="text-gray-700">Consider Inflation</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  {...register("reinvestAfterFormation")}
                  onChange={calculateResults}
                />
                <label className="text-gray-700">Reinvest Income After Formation</label>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition duration-200"
        >
          Calculate Projection
        </button>
      </form>

      {projections && (
        <div>
          {/* Summary Section */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Investment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-600">Total Invested</div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(calculateTotalInvested(projections) + formValues.initialCapital)}
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projections.map((year, index) => (
                    <tr 
                      key={year.age}
                      className={year.age > formValues.endCapitalFormationAge ? "bg-gray-50" : ""}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">{year.age}</td>
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
  );
};

export default InvestmentCalculator;