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

// Shared Components
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h1 className="font-serif text-2xl text-slate-800 mb-3">{title}</h1>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function FormField({ id, label, children, error, helpText, required = false }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        {helpText && <span className="text-gray-500 text-xs font-normal ml-2">({helpText})</span>}
      </label>
      {children}
      {error && (
        <div className="text-red-600 text-xs mt-1" role="alert" id={`${id}-error`}>
          {error}
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h2 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h2>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ title, value, subtitle, description, isValid = true }) {
  if (!isValid) return null;
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="text-3xl font-serif text-blue-600 mb-2" aria-live="polite">{value}</div>
      <div className="text-sm text-gray-700">
        <div><strong>{title}</strong> - {subtitle}</div>
        <div className="mt-1">{description}</div>
      </div>
    </div>
  );
}

// Enhanced Custom label component that shows values consistently positioned
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  // Position all labels above the bar area for consistency
  const labelY = y - 8;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="#000"
      fontSize="11"
      fontWeight="bold"
    >
      {isNegative ? '(' : ''}${Math.abs(value).toFixed(2)}{isNegative ? ')' : ''}
    </text>
  );
};

export default function GrowthRateCalculator() {
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
    
    // Financial logic validation
    if (inputs.requiredReturn > 0 && inputs.expectedDividend > 0 && inputs.marketPrice > 0) {
      const impliedGrowth = (inputs.requiredReturn / 100) - (inputs.expectedDividend / inputs.marketPrice);
      if (impliedGrowth >= inputs.requiredReturn / 100) {
        errors.financial = "These inputs would result in invalid growth rate (g ≥ r)";
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
        cashflows.push({
          year,
          dividend: 0,
          investment: -price,
          total: -price
        });
      } else {
        const dividend = d0 * Math.pow(1 + impliedGrowth, year);
        cashflows.push({
          year,
          dividend,
          investment: 0,
          total: dividend
        });
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

  const chartData = useMemo(() => {
    if (!model) return [];
    
    return model.cashflows.map(cf => ({
      yearLabel: cf.year.toString(),
      year: cf.year,
      dividendFlow: cf.dividend,
      investmentFlow: cf.investment,
      growthLine: model.impliedGrowth,
    }));
  }, [model]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Card title="Implied Growth Rate Calculator (Gordon Growth Model)">
          {/* Skip Navigation */}
          <nav className="mb-4">
            <a href="#growth-inputs" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to inputs
            </a>
            <a href="#growth-results" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-20 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to results
            </a>
            <a href="#growth-chart" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-36 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to chart
            </a>
          </nav>

          {/* Inputs */}
          <section id="growth-inputs" aria-labelledby="inputs-heading">
            <h2 id="inputs-heading" className="sr-only">Stock Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <FormField 
                id="market-price" 
                label="Market Price per Share" 
                helpText="$1 - $500"
                error={inputErrors.marketPrice}
                required
              >
                <input
                  id="market-price"
                  type="number"
                  step="0.01"
                  min="1"
                  max="500"
                  value={inputs.marketPrice}
                  onChange={(e) => handleInputChange('marketPrice', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.marketPrice ? "market-price-error" : "market-price-help"}
                  aria-invalid={inputErrors.marketPrice ? 'true' : 'false'}
                />
                <div id="market-price-help" className="sr-only">Enter the current market price per share</div>
              </FormField>

              <FormField 
                id="dividend-amount" 
                label="Current Annual Dividend" 
                helpText="$0 - $50"
                error={inputErrors.dividendAmount}
                required
              >
                <input
                  id="dividend-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={inputs.dividendAmount}
                  onChange={(e) => handleInputChange('dividendAmount', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.dividendAmount ? "dividend-amount-error" : "dividend-amount-help"}
                  aria-invalid={inputErrors.dividendAmount ? 'true' : 'false'}
                />
                <div id="dividend-amount-help" className="sr-only">Enter the current annual dividend per share</div>
              </FormField>

              <FormField 
                id="required-return" 
                label="Required Return (%)" 
                helpText="0% - 25%"
                error={inputErrors.requiredReturn}
                required
              >
                <input
                  id="required-return"
                  type="number"
                  step="0.01"
                  min="0"
                  max="25"
                  value={inputs.requiredReturn}
                  onChange={(e) => handleInputChange('requiredReturn', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.requiredReturn ? "required-return-error" : "required-return-help"}
                  aria-invalid={inputErrors.requiredReturn ? 'true' : 'false'}
                />
                <div id="required-return-help" className="sr-only">Enter the required return percentage for this investment</div>
              </FormField>

              <FormField 
                id="expected-dividend" 
                label="Expected Next Dividend" 
                helpText="$0 - $50"
                error={inputErrors.expectedDividend}
                required
              >
                <input
                  id="expected-dividend"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={inputs.expectedDividend}
                  onChange={(e) => handleInputChange('expectedDividend', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.expectedDividend ? "expected-dividend-error" : "expected-dividend-help"}
                  aria-invalid={inputErrors.expectedDividend ? 'true' : 'false'}
                />
                <div id="expected-dividend-help" className="sr-only">Enter the expected dividend for the next year</div>
              </FormField>
            </div>
          </section>

          <ValidationMessage errors={inputErrors} />

          {/* Model validity warning */}
          {model && !model.isValid && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg" role="alert">
              <div className="text-yellow-800 text-sm">
                <strong>Warning:</strong> Implied growth rate should be positive and less than required return for a valid model. 
                Current: g = {model.impliedGrowth.toFixed(2)}%, r = {inputs.requiredReturn.toFixed(2)}%
              </div>
            </div>
          )}

          {/* D1 consistency warning */}
          {model && !model.d1Consistent && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg" role="alert">
              <div className="text-orange-800 text-sm">
                <strong>Note:</strong> Expected Dividend (${inputs.expectedDividend.toFixed(2)}) differs from calculated D₁ 
                (${model.calculatedD1.toFixed(2)}) based on current dividend and implied growth rate.
              </div>
            </div>
          )}

          {/* Results */}
          <section id="growth-results" aria-labelledby="results-heading">
            <h2 id="results-heading" className="sr-only">Calculation Results</h2>
            {model && model.isValid && (
              <ResultCard
                title="Implied Growth Rate"
                value={`${model.impliedGrowth.toFixed(2)}%`}
                subtitle="the growth rate implied by current market price"
                description={`Using Gordon Growth Model: g = r - (D₁ ÷ P) | Given required return: ${inputs.requiredReturn.toFixed(2)}%`}
                isValid={model.isValid}
              />
            )}
          </section>

          {/* Screen Reader Data Table */}
          {model && model.isValid && (
            <div className="sr-only">
              <h2>Cash Flow Projections Data Table</h2>
              <table>
                <caption>Cash flow projections showing initial investment and growing dividend payments</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Investment ($)</th>
                    <th scope="col">Dividend ($)</th>
                    <th scope="col">Growth Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(row => (
                    <tr key={row.year}>
                      <th scope="row">{row.yearLabel}</th>
                      <td className="text-right">{row.investmentFlow ? `(${Math.abs(row.investmentFlow).toFixed(2)})` : '--'}</td>
                      <td className="text-right">{row.dividendFlow ? `${row.dividendFlow.toFixed(2)}` : '--'}</td>
                      <td className="text-right">{row.growthLine.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart */}
          {model && model.isValid && (
            <section id="growth-chart" aria-labelledby="chart-heading">
              <h2 id="chart-heading" className="sr-only">Visual Chart</h2>
              
              <div className="text-center mb-4">
                <h3 className="font-serif text-lg text-slate-700">Equity Cash Flows (in US$) and Resulting Implied Growth Rate</h3>
                <p className="text-sm text-gray-600 mt-1">(Only first 10 years are shown)</p>
              </div>
              
              <div className="mb-4 text-sm text-gray-600 flex flex-wrap items-center gap-6" role="img" aria-label="Chart legend">
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-green-500 mr-2 rounded" aria-hidden="true"></span>
                  Dividend Cash Flow
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-red-400 mr-2 rounded" aria-hidden="true"></span>
                  Initial Investment
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-purple-600 mr-2 rounded" aria-hidden="true"></span>
                  Growth Rate: {model.impliedGrowth.toFixed(2)}%
                </span>
              </div>

              <div className="h-96" 
                   role="img" 
                   aria-labelledby="growth-chart-title" 
                   aria-describedby="growth-chart-description">
                
                <div className="sr-only">
                  <h3 id="growth-chart-title">Growth Rate and Dividend Projection Chart</h3>
                  <p id="growth-chart-description">
                    Bar chart showing initial stock purchase of ${inputs.marketPrice.toFixed(2)} and projected dividend growth starting at ${inputs.dividendAmount.toFixed(2)} over 10 years, 
                    with implied growth rate of {model.impliedGrowth.toFixed(2)}% based on required return of {inputs.requiredReturn.toFixed(2)}% and expected next dividend of ${inputs.expectedDividend.toFixed(2)}
                  </p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 30, right: 100, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="yearLabel" 
                      label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                    />
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
                    
                    <Bar 
                      yAxisId="left" 
                      dataKey="dividendFlow" 
                      stackId="cash" 
                      fill="#10b981" 
                      name="Dividend Cash Flow"
                      label={<CustomLabel />}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="investmentFlow" 
                      stackId="cash" 
                      fill="#f87171" 
                      name="Initial Investment"
                      label={<CustomLabel />}
                    />
                    
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="growthLine" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      dot={false}
                      name="Growth Rate"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <strong>Implied Growth Rate Model:</strong> Given the market price and required return, this calculates 
                what growth rate investors are implicitly expecting. The model shows how current market pricing reflects 
                growth expectations for dividend payments.
              </div>
            </section>
          )}

          {/* Educational Context */}
          <section className="mt-8 p-4 bg-blue-50 rounded-lg" aria-labelledby="education-heading">
            <h2 id="education-heading" className="font-semibold text-blue-800 mb-2">Educational Context</h2>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>Implied Growth Rate:</strong> The dividend growth rate that investors are implicitly expecting based on current market pricing.</p>
              <p><strong>Calculation Formula:</strong> g = r - (D₁ ÷ P₀), where g is growth rate, r is required return, D₁ is next year's dividend, and P₀ is current price.</p>
              <p><strong>Market Expectations:</strong> This model reveals what the market believes about future growth prospects by analyzing current stock prices.</p>
              <p><strong>Consistency Check:</strong> The calculator compares your expected dividend (D₁) with what the current dividend would grow to at the implied rate.</p>
              <p className="text-xs mt-2"><strong>Applications:</strong> Useful for valuation analysis, identifying overvalued/undervalued stocks, and understanding market sentiment about growth prospects.</p>
            </div>
          </section>
        </Card>
      </main>
    </div>
  );
}