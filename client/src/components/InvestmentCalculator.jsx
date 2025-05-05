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
  const { register, watch, handleSubmit, setValue, formState: { errors } } = useForm({
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
  const [spData, setSpData] = useState(null);
  const [cpiData, setCpiData] = useState(null);
  const [returnSuggestions, setReturnSuggestions] = useState(null);
  const [inflationSuggestions, setInflationSuggestions] = useState(null);
  const formValues = watch();
  
  // Fetch historical data from Macrotrends and FRED
  const [dataStatus, setDataStatus] = useState({
    sp500: { status: 'loading', usingFallback: false },
    cpi: { status: 'loading', usingFallback: false }
  });

  // Function to retry data fetching
  const retryDataFetch = () => {
    setDataStatus({
      sp500: { status: 'loading', usingFallback: false },
      cpi: { status: 'loading', usingFallback: false }
    });
    // Reset suggestions to force recalculation
    setReturnSuggestions(null);
    setInflationSuggestions(null);
    fetchHistoricalData();
  };

  // Fetch historical data function
  const fetchHistoricalData = async () => {
    try {
      // Try to fetch S&P 500 data from Macrotrends
      try {
        setDataStatus(prev => ({
          ...prev,
          sp500: { status: 'loading', usingFallback: false }
        }));
        
        // Используем предварительно подготовленные данные S&P 500 за длительный период
        // Данные взяты с Macrotrends.net (https://www.macrotrends.net/2526/sp-500-historical-annual-returns)
        const sp500HistoricalData = [
          { year: 1990, value: 339.97 },
          { year: 1991, value: 417.09 },
          { year: 1992, value: 435.71 },
          { year: 1993, value: 466.45 },
          { year: 1994, value: 459.27 },
          { year: 1995, value: 615.93 },
          { year: 1996, value: 740.74 },
          { year: 1997, value: 970.43 },
          { year: 1998, value: 1229.23 },
          { year: 1999, value: 1469.25 },
          { year: 2000, value: 1320.28 },
          { year: 2001, value: 1148.08 },
          { year: 2002, value: 879.82 },
          { year: 2003, value: 1111.92 },
          { year: 2004, value: 1211.92 },
          { year: 2005, value: 1248.29 },
          { year: 2006, value: 1418.3 },
          { year: 2007, value: 1468.36 },
          { year: 2008, value: 903.25 },
          { year: 2009, value: 1115.1 },
          { year: 2010, value: 1257.64 },
          { year: 2011, value: 1257.6 },
          { year: 2012, value: 1426.19 },
          { year: 2013, value: 1848.36 },
          { year: 2014, value: 2058.9 },
          { year: 2015, value: 2043.94 },
          { year: 2016, value: 2238.83 },
          { year: 2017, value: 2673.61 },
          { year: 2018, value: 2506.85 },
          { year: 2019, value: 3230.78 },
          { year: 2020, value: 3756.07 },
          { year: 2021, value: 4766.18 },
          { year: 2022, value: 3839.5 },
          { year: 2023, value: 4769.83 },
          { year: 2024, value: 5123.25 } // Последнее значение на момент разработки
        ];
        
        // Преобразуем годовые данные в формат с датами
        const parsedSpData = sp500HistoricalData.map(item => ({
          date: new Date(item.year, 11, 31), // 31 декабря указанного года
          value: item.value
        })).sort((a, b) => a.date - b.date);
        
        // Verify we have enough data
        if (parsedSpData.length < 10) {
          throw new Error('Not enough data points in S&P 500 dataset');
        }
        
        setSpData(parsedSpData);
        setDataStatus(prev => ({
          ...prev,
          sp500: { status: 'success', usingFallback: false }
        }));
      } catch (spError) {
        // Removed console warning about S&P 500 data processing error
        setDataStatus(prev => ({
          ...prev,
          sp500: { status: 'error', usingFallback: false }
        }));
      }
      
      // Try to fetch CPI data using a CORS proxy
      try {
        setDataStatus(prev => ({
          ...prev,
          cpi: { status: 'loading', usingFallback: false }
        }));
        
        // Используем предварительно подготовленные данные по инфляции
        // Данные по годовой инфляции в США
        const cpiHistoricalData = [
          { year: 1990, value: 130.7 },
          { year: 1991, value: 136.2 },
          { year: 1992, value: 140.3 },
          { year: 1993, value: 144.5 },
          { year: 1994, value: 148.2 },
          { year: 1995, value: 152.4 },
          { year: 1996, value: 156.9 },
          { year: 1997, value: 160.5 },
          { year: 1998, value: 163.0 },
          { year: 1999, value: 166.6 },
          { year: 2000, value: 172.2 },
          { year: 2001, value: 177.1 },
          { year: 2002, value: 179.9 },
          { year: 2003, value: 184.0 },
          { year: 2004, value: 188.9 },
          { year: 2005, value: 195.3 },
          { year: 2006, value: 201.6 },
          { year: 2007, value: 207.3 },
          { year: 2008, value: 215.303 },
          { year: 2009, value: 214.537 },
          { year: 2010, value: 218.056 },
          { year: 2011, value: 224.939 },
          { year: 2012, value: 229.594 },
          { year: 2013, value: 232.957 },
          { year: 2014, value: 236.736 },
          { year: 2015, value: 237.017 },
          { year: 2016, value: 240.007 },
          { year: 2017, value: 245.12 },
          { year: 2018, value: 251.107 },
          { year: 2019, value: 255.657 },
          { year: 2020, value: 258.811 },
          { year: 2021, value: 271.696 },
          { year: 2022, value: 292.655 },
          { year: 2023, value: 303.292 },
          { year: 2024, value: 309.686 } // Последнее значение на момент разработки
        ];
        
        // Преобразуем годовые данные в формат с датами
        const parsedCpiData = cpiHistoricalData.map(item => ({
          date: new Date(item.year, 11, 31), // 31 декабря указанного года
          value: item.value
        })).sort((a, b) => a.date - b.date);
        
        // Verify we have enough data
        if (parsedCpiData.length < 10) {
          throw new Error('Not enough data points in CPI dataset');
        }
        
        setCpiData(parsedCpiData);
        setDataStatus(prev => ({
          ...prev,
          cpi: { status: 'success', usingFallback: false }
        }));
      } catch (cpiError) {
        // Removed console warning about CPI data processing error
        setDataStatus(prev => ({
          ...prev,
          cpi: { status: 'error', usingFallback: false }
        }));
      }
    } catch (error) {
      // Removed console error about fetchHistoricalData error
      setDataStatus({
        sp500: { status: 'error', usingFallback: false },
        cpi: { status: 'error', usingFallback: false }
      });
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  // Calculate suggestions when data is available
  useEffect(() => {
    // Process S&P 500 data if available
    if (spData && spData.length > 0 && !returnSuggestions) {
      try {
        const now = new Date();
        const latestSpData = spData[spData.length - 1];
        
        // Calculate CAGR for different periods
        const calculateCAGR = (years) => {
          const startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - years);
          
          // Найдем запись, ближайшую к нужной дате
          const startRecord = spData.find(item => item.date >= startDate) || spData[0];
          const endRecord = latestSpData;
          
          // Проверим, не используем ли мы самую раннюю доступную запись
          const isUsingOldestRecord = startRecord === spData[0];
          
          // Убрано расширенное логирование для отладки
          
          const actualYears = (endRecord.date - startRecord.date) / (1000 * 60 * 60 * 24 * 365);
          
          const cagr = Math.pow(endRecord.value / startRecord.value, 1 / actualYears) - 1;
          return parseFloat((cagr * 100).toFixed(1));
        };
        
        // Получим информацию о диапазоне данных
        const oldestDate = spData[0].date;
        const newestDate = latestSpData.date;
        const dataRangeYears = (newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 365);
        
        // Определим три периода для отображения (короткий, средний, длинный)
        // Всегда используем 5 лет для короткого периода, если данных достаточно
        const shortPeriod = Math.min(5, Math.floor(dataRangeYears));
        
        // Для среднего периода используем 10 лет или половину доступного диапазона
        const mediumPeriod = Math.min(10, Math.floor(dataRangeYears / 2));
        
        // Для длинного периода используем максимально доступный период, но не менее 15 лет
        // если данных достаточно
        const longPeriod = Math.max(Math.min(Math.floor(dataRangeYears), 30), 
                                   dataRangeYears >= 15 ? 15 : Math.floor(dataRangeYears));
        
        // Рассчитываем CAGR для выбранных периодов
        const shortPeriodCAGR = calculateCAGR(shortPeriod);
        const mediumPeriodCAGR = calculateCAGR(mediumPeriod);
        const longPeriodCAGR = calculateCAGR(longPeriod);
        
        // Сохраняем информацию о фактических периодах
        const actualPeriods = {
          short: shortPeriod,
          medium: mediumPeriod,
          long: longPeriod
        };
        
        setReturnSuggestions({
          shortPeriod: shortPeriodCAGR,
          mediumPeriod: mediumPeriodCAGR,
          longPeriod: longPeriodCAGR
        });
        
        setDataStatus(prev => ({
          ...prev,
          sp500: { 
            status: 'success', 
            usingFallback: false,
            actualPeriods: actualPeriods
          }
        }));
      } catch (error) {
        // Removed console warning about return calculation error
        setDataStatus(prev => ({
          ...prev,
          sp500: { status: 'error', usingFallback: false }
        }));
        setReturnSuggestions(null);
      }
    }
  }, [spData, returnSuggestions]);
  
  // Separate useEffect for CPI data to avoid unnecessary recalculations
  useEffect(() => {
    // Process CPI data if available
    if (cpiData && cpiData.length > 0 && !inflationSuggestions) {
      try {
        const now = new Date();
        const latestCpiData = cpiData[cpiData.length - 1];
        
        // Calculate YoY inflation for last year
        const calculateYoYInflation = () => {
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          
          // Find closest records to now and one year ago
          const currentRecord = latestCpiData;
          const previousYearRecord = cpiData.find(item => item.date >= oneYearAgo) || cpiData[0];
          
          // Убрано логирование расчета годовой инфляции
          
          return parseFloat(((currentRecord.value / previousYearRecord.value - 1) * 100).toFixed(1));
        };
        
        // Calculate average inflation for different periods
        const calculateAvgInflation = (years) => {
          const startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - years);
          
          // Найдем запись, ближайшую к нужной дате
          const startRecord = cpiData.find(item => item.date >= startDate) || cpiData[0];
          const endRecord = latestCpiData;
          
          // Проверим, не используем ли мы самую раннюю доступную запись
          const isUsingOldestRecord = startRecord === cpiData[0];
          
          // Убрано расширенное логирование для отладки
          
          const actualYears = (endRecord.date - startRecord.date) / (1000 * 60 * 60 * 24 * 365);
          
          const avgAnnualRate = Math.pow(endRecord.value / startRecord.value, 1 / actualYears) - 1;
          return parseFloat((avgAnnualRate * 100).toFixed(1));
        };
        
        // Определим три периода для инфляции, аналогично доходности
        // Используем 5 лет для короткого периода
        const shortPeriodInflation = 5; // 5 лет для короткого периода инфляции
        
        // Получим информацию о диапазоне данных CPI
        const oldestCpiDate = cpiData[0].date;
        const newestCpiDate = latestCpiData.date;
        const cpiDataRangeYears = (newestCpiDate - oldestCpiDate) / (1000 * 60 * 60 * 24 * 365);
        
        // Для среднего периода используем 10 лет или половину доступного диапазона
        const mediumPeriodInflation = Math.min(10, Math.floor(cpiDataRangeYears / 2));
        
        // Для длинного периода используем максимально доступный период, но не менее 20 лет
        // если данных достаточно
        const longPeriodInflation = Math.max(Math.min(Math.floor(cpiDataRangeYears), 30), 
                                           cpiDataRangeYears >= 20 ? 20 : Math.floor(cpiDataRangeYears));
        
        // Рассчитываем инфляцию для выбранных периодов
        const shortPeriodAvg = calculateAvgInflation(shortPeriodInflation); // Используем 5-летний период
        const mediumPeriodAvg = calculateAvgInflation(mediumPeriodInflation);
        const longPeriodAvg = calculateAvgInflation(longPeriodInflation);
        
        // Сохраняем информацию о фактических периодах
        const actualInflationPeriods = {
          short: shortPeriodInflation,
          medium: mediumPeriodInflation,
          long: longPeriodInflation
        };
        
        setInflationSuggestions({
          shortPeriod: shortPeriodAvg,
          mediumPeriod: mediumPeriodAvg,
          longPeriod: longPeriodAvg
        });
        
        setDataStatus(prev => ({
          ...prev,
          cpi: { 
            status: 'success', 
            usingFallback: false,
            actualPeriods: actualInflationPeriods
          }
        }));
      } catch (error) {
        // Removed console warning about inflation calculation error
        setDataStatus(prev => ({
          ...prev,
          cpi: { status: 'error', usingFallback: false }
        }));
        setInflationSuggestions(null);
      }
    }
  }, [cpiData, inflationSuggestions]);

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
      // Removed console error about calculation error
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
        // Removed console warning about duplicate age values
        return false;
      }
      uniqueAges.add(year.age);
      return true;
    });
    
    // Removed console logs for chart data range
    
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
    
    // Removed console logs for formation period data points
    
    // If there are both formation and post-formation data points, ensure continuity
    if (formation.length > 0 && postFormation.length > 0) {
      // Find the last formation age and first post-formation age
      const lastFormationAge = formation[formation.length - 1].age;
      const firstPostFormationAge = postFormation[0].age;
      
      // Check if there's a gap between the periods
      if (firstPostFormationAge - lastFormationAge > 1) {
        // Removed console warning about gap detection
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700">Starting Age</label>
                  <span className="text-sm text-gray-500">{formValues.startingAge}</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="70"
                  step="1"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  {...register("startingAge", { required: true, min: 16, max: 70 })}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>16</span>
                  <span>70</span>
                </div>
                {errors.startingAge && <span className="text-red-500 text-sm">Starting age is required (16-70)</span>}
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700">Annual Return (%)</label>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      // Сброс всех данных для тестирования
                      setSpData(null);
                      setCpiData(null);
                      setReturnSuggestions(null);
                      setInflationSuggestions(null);
                      setDataStatus({
                        sp500: { status: 'loading', usingFallback: false },
                        cpi: { status: 'loading', usingFallback: false }
                      });
                      // Запуск загрузки данных заново
                      setTimeout(() => fetchHistoricalData(), 500);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                    title="Reset data to test loading mechanism"
                  >
                    Reset data
                  </button>
                </div>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("annualReturn", { required: true, min: 0, max: 30 })}
                />
                {errors.annualReturn && <span className="text-red-500 text-sm">Annual return is required (0-30%)</span>}
                <div className="mt-2">
                  {dataStatus.sp500.status === 'loading' ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading historical data...
                    </div>
                  ) : dataStatus.sp500.status === 'error' ? (
                    <div className="mb-2">
                      <div className="text-sm text-amber-600 mb-1">
                        FRED data unavailable
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            retryDataFetch();
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700 underline text-xs"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : returnSuggestions && (
                    <div className="flex flex-wrap gap-2">
                      <span 
                        className="text-sm px-2 py-1 border border-blue-200 bg-blue-50 text-blue-800 rounded cursor-pointer hover:bg-blue-100 transition"
                        title={`S&P 500 ${dataStatus.sp500.actualPeriods?.short || 5}Y average return (source: Macrotrends)`}
                        onClick={() => setValue("annualReturn", returnSuggestions.shortPeriod)}
                      >
                        {dataStatus.sp500.actualPeriods?.short || 5}Y: {returnSuggestions.shortPeriod}%
                      </span>
                      <span 
                        className="text-sm px-2 py-1 border border-blue-200 bg-blue-50 text-blue-800 rounded cursor-pointer hover:bg-blue-100 transition"
                        title={`S&P 500 ${dataStatus.sp500.actualPeriods?.medium || 10}Y average return (source: Macrotrends)`}
                        onClick={() => setValue("annualReturn", returnSuggestions.mediumPeriod)}
                      >
                        {dataStatus.sp500.actualPeriods?.medium || 10}Y: {returnSuggestions.mediumPeriod}%
                      </span>
                      <span 
                        className="text-sm px-2 py-1 border border-blue-200 bg-blue-50 text-blue-800 rounded cursor-pointer hover:bg-blue-100 transition"
                        title={`S&P 500 ${dataStatus.sp500.actualPeriods?.long || 30}Y average return (source: Macrotrends)`}
                        onClick={() => setValue("annualReturn", returnSuggestions.longPeriod)}
                      >
                        {dataStatus.sp500.actualPeriods?.long || 30}Y: {returnSuggestions.longPeriod}%
                      </span>
                    </div>
                  )}
                </div>
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
                <div className="mt-2">
                  {dataStatus.cpi.status === 'loading' ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading inflation data...
                    </div>
                  ) : dataStatus.cpi.status === 'error' ? (
                    <div className="mb-2">
                      <div className="text-sm text-amber-600 mb-1">
                        FRED data unavailable
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            retryDataFetch();
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700 underline text-xs"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : inflationSuggestions && (
                    <div className="flex flex-wrap gap-2">
                      <span 
                        className="text-sm px-2 py-1 border border-green-200 bg-green-50 text-green-800 rounded cursor-pointer hover:bg-green-100 transition"
                        title={`US CPI ${dataStatus.cpi.actualPeriods?.short || 1}Y YoY change`}
                        onClick={() => setValue("annualInflation", inflationSuggestions.shortPeriod)}
                      >
                        {dataStatus.cpi.actualPeriods?.short || 1}Y: {inflationSuggestions.shortPeriod}%
                      </span>
                      <span 
                        className="text-sm px-2 py-1 border border-green-200 bg-green-50 text-green-800 rounded cursor-pointer hover:bg-green-100 transition"
                        title={`US CPI ${dataStatus.cpi.actualPeriods?.medium || 10}Y average inflation`}
                        onClick={() => setValue("annualInflation", inflationSuggestions.mediumPeriod)}
                      >
                        {dataStatus.cpi.actualPeriods?.medium || 10}Y: {inflationSuggestions.mediumPeriod}%
                      </span>
                      <span 
                        className="text-sm px-2 py-1 border border-green-200 bg-green-50 text-green-800 rounded cursor-pointer hover:bg-green-100 transition"
                        title={`US CPI ${dataStatus.cpi.actualPeriods?.long || 30}Y average inflation`}
                        onClick={() => setValue("annualInflation", inflationSuggestions.longPeriod)}
                      >
                        {dataStatus.cpi.actualPeriods?.long || 30}Y: {inflationSuggestions.longPeriod}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700">End Capital Formation Age</label>
                  <span className="text-sm text-gray-500">{formValues.endCapitalFormationAge}</span>
                </div>
                <input
                  type="range"
                  min={Number(formValues.startingAge || 16)}
                  max="100"
                  step="1"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  {...register("endCapitalFormationAge", { 
                    required: true, 
                    min: Number(formValues.startingAge || 16), 
                    max: 100 
                  })}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formValues.startingAge || 16}</span>
                  <span>100</span>
                </div>
                {errors.endCapitalFormationAge && <span className="text-red-500 text-sm">End age is required (starting age to 100)</span>}
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