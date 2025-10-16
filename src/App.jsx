import { useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// CFA-branded color palette
const COLORS = {
  primary: "#4476ff",
  dark: "#06005a",
  darkAlt: "#38337b",
  positive: "#6991ff",
  negative: "#ea792d",
  purple: "#7a46ff",
  purpleAlt: "#50037f",
  lightBlue: "#4476ff",
  orange: "#ea792d",
  darkText: "#06005a",
  green: "#10b981",
  red: "#f87171",
};

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function InfoIcon({ children, id }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`${id}-tooltip`}
        aria-label="More information"
      >
        ?
      </button>
      
      {showTooltip && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
        >
          {children}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h3 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h3>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  const labelY = y - 8;
  
  return (
    <text x={x + width / 2} y={labelY} textAnchor="middle" fill={COLORS.darkText} fontSize="11" fontWeight="bold">
      {isNegative ? '(' : ''}${Math.abs(value).toFixed(2)}{isNegative ? ')' : ''}
    </text>
  );
};

function ResultsSection({ model, inputs }) {
  return (
    <div className="space-y-6">
      {/* Implied Growth */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-3xl font-serif text-blue-600 mb-2">{model.impliedGrowth.toFixed(2)}%</div>
        <div className="text-sm text-gray-700">
          <div><strong>Implied Growth Rate</strong> - expected by the market</div>
          <div className="mt-2">
            <div className="text-xs mb-1">Formula: g = r - (D₁ ÷ P)</div>
            <div className="font-mono text-xs bg-white px-2 py-1 rounded border">
              Given r: {inputs.requiredReturn.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Consistency Check */}
      {!model.d1Consistent && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-800">
            <div className="font-semibold mb-1">Consistency Note</div>
            <div className="text-xs">
              Expected D₁: ${inputs.expectedDividend.toFixed(2)}<br />
              Calculated D₁: ${model.calculatedD1.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Model Info */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-700">
          <div className="font-semibold mb-2">Gordon Growth Model</div>
          <div className="text-xs space-y-1">
            <div>• Required return: {inputs.requiredReturn.toFixed(2)}%</div>
            <div>• Dividend yield: {((inputs.expectedDividend / inputs.marketPrice) * 100).toFixed(2)}%</div>
            <div>• Implied growth: {model.impliedGrowth.toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrowthChart({ model, inputs }) {
  const chartData = useMemo(() => {
    return model.cashflows.map(cf => ({
      yearLabel: cf.year.toString(),
      year: cf.year,
      dividendFlow: cf.dividend,
      investmentFlow: cf.investment,
      growthLine: model.impliedGrowth,
    }));
  }, [model]);

  return (
    <>
      {/* Legend */}
      <div className="mb-4 text-sm text-gray-600 flex flex-wrap items-center gap-6">
        <span className="inline-flex items-center">
          <span className="w-3 h-3 mr-2 rounded" style={{backgroundColor: COLORS.green}}></span>
          Dividend Cash Flow
        </span>
        <span className="inline-flex items-center">
          <span className="w-3 h-3 mr-2 rounded" style={{backgroundColor: COLORS.red}}></span>
          Initial Investment
        </span>
        <span className="inline-flex items-center">
          <span className="w-3 h-3 mr-2 rounded" style={{backgroundColor: COLORS.purple}}></span>
          Growth Rate: {model.impliedGrowth.toFixed(2)}%
        </span>
      </div>

      {/* Chart */}
      <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
        <div className="sr-only">
          <h3 id="chart-title">Growth Rate Chart</h3>
          <p id="chart-description">
            Bar chart showing initial stock purchase of ${inputs.marketPrice.toFixed(2)} and projected dividend growth 
            starting at ${inputs.dividendAmount.toFixed(2)} with implied growth rate of {model.impliedGrowth.toFixed(2)}%
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 30, right: 100, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="yearLabel" label={{ value: 'Years', position: 'insideBottom', offset: -10 }} />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Cash Flows ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: 'Growth Rate (%)', angle: 90, position: 'insideRight' }}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              domain={[0, Math.max(5, model.impliedGrowth * 1.5)]}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Growth Rate') return [`${Number(value).toFixed(2)}%`, name];
                return [`$${Number(value).toFixed(2)}`, name];
              }}
              labelFormatter={(label) => `Year: ${label}`}
            />
            
            <Bar yAxisId="left" dataKey="dividendFlow" stackId="cash" fill={COLORS.green} name="Dividend Cash Flow" label={<CustomLabel />} />
            <Bar yAxisId="left" dataKey="investmentFlow" stackId="cash" fill={COLORS.red} name="Initial Investment" label={<CustomLabel />} />
            <Line yAxisId="right" type="monotone" dataKey="growthLine" stroke={COLORS.purple} strokeWidth={3} dot={false} name="Growth Rate" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Educational note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
        <strong>Implied Growth Model:</strong> Calculates what growth rate investors are implicitly expecting based on current market pricing.
      </div>
    </>
  );
}

export default function App() {
  const [inputs, setInputs] = useState({ 
    marketPrice: 54.56, 
    dividendAmount: 3.60, 
    requiredReturn: 7.40,
    expectedDividend: 3.50
  });
  
  const validateInputs = useCallback((inputs) => {
    const errors = {};
    if (!inputs.marketPrice || inputs.marketPrice < 1) {
      errors.marketPrice = "Market price must be at least $1";
    } else if (inputs.marketPrice > 500) {
      errors.marketPrice = "Market price cannot exceed $500";
    }
    
    if (inputs.dividendAmount < 0) {
      errors.dividendAmount = "Current dividend cannot be negative";
    } else if (inputs.dividendAmount > 50) {
      errors.dividendAmount = "Current dividend cannot exceed $50";
    }
    
    if (!inputs.requiredReturn || inputs.requiredReturn <= 0) {
      errors.requiredReturn = "Required return must be positive";
    } else if (inputs.requiredReturn > 25) {
      errors.requiredReturn = "Required return cannot exceed 25%";
    }
    
    if (inputs.expectedDividend < 0) {
      errors.expectedDividend = "Expected dividend cannot be negative";
    } else if (inputs.expectedDividend > 50) {
      errors.expectedDividend = "Expected dividend cannot exceed $50";
    }
    
    if (inputs.requiredReturn > 0 && inputs.expectedDividend > 0 && inputs.marketPrice > 0) {
      const impliedGrowth = (inputs.requiredReturn / 100) - (inputs.expectedDividend / inputs.marketPrice);
      if (impliedGrowth >= inputs.requiredReturn / 100) {
        errors.financial = "Inputs result in invalid growth rate (g ≥ r)";
      }
    }
    
    return errors;
  }, []);
  
  const handleInputChange = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: +value }));
  }, []);
  
  const inputErrors = validateInputs(inputs);
  
  const model = useMemo(() => {
    if (Object.keys(inputErrors).length > 0) return null;
    
    const r = inputs.requiredReturn / 100;
    const d0 = inputs.dividendAmount;
    const d1 = inputs.expectedDividend;
    const price = inputs.marketPrice;
    
    const impliedGrowth = r - (d1 / price);
    const impliedGrowthPct = impliedGrowth * 100;
    
    const calculatedD1 = d0 * (1 + impliedGrowth);
    const d1Consistent = Math.abs(d1 - calculatedD1) < 0.01;
    
    const cashflows = [];
    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        cashflows.push({ year, dividend: 0, investment: -price, total: -price });
      } else {
        const dividend = d0 * Math.pow(1 + impliedGrowth, year);
        cashflows.push({ year, dividend, investment: 0, total: dividend });
      }
    }
    
    return {
      impliedGrowth: impliedGrowthPct,
      cashflows,
      d1Consistent,
      calculatedD1,
      isValid: impliedGrowth < r && impliedGrowth >= 0
    };
  }, [inputs, inputErrors]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">

        {/* RESULTS AND CHART */}
        {model && model.isValid && (
          <>
            {/* MOBILE */}
            <div className="lg:hidden space-y-6">
              <Card title="Results">
                <ResultsSection model={model} inputs={inputs} />
              </Card>
              <Card title="Growth Rate Analysis">
                <GrowthChart model={model} inputs={inputs} />
              </Card>
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <Card title="Results">
                  <ResultsSection model={model} inputs={inputs} />
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card title="Growth Rate Analysis">
                  <GrowthChart model={model} inputs={inputs} />
                </Card>
              </div>
            </div>
          </>
        )}

        {/* INPUTS */}
        <Card title="Implied Growth Rate Calculator (Gordon Growth Model)">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            
            <div className="flex items-center gap-2">
              <label htmlFor="price" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Market Price
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="price">Current price per share</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={inputs.marketPrice}
                  onChange={(e) => handleInputChange('marketPrice', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.marketPrice ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="dividend" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Current Dividend
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="dividend">Annual dividend per share</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="dividend"
                  type="number"
                  step="0.01"
                  value={inputs.dividendAmount}
                  onChange={(e) => handleInputChange('dividendAmount', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.dividendAmount ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="return" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Required Return (%)
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="return">Investor's required return</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="return"
                  type="number"
                  step="0.01"
                  value={inputs.requiredReturn}
                  onChange={(e) => handleInputChange('requiredReturn', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.requiredReturn ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="expected" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Expected D₁
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="expected">Next year's dividend</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="expected"
                  type="number"
                  step="0.01"
                  value={inputs.expectedDividend}
                  onChange={(e) => handleInputChange('expectedDividend', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.expectedDividend ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

          </div>
          
          <ValidationMessage errors={inputErrors} />
        </Card>

      </main>
    </div>
  );
}