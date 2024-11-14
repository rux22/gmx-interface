import React, { useState } from 'react';
import { Area, AreaChart, Line, LineChart, YAxis, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, Check } from 'lucide-react';

interface ChartData {
  date: string;
  indexPrice: number;
  marketPrice: number;
  fpu: number;
  volume: number;
  rate: number;
  velocity: number;
}

interface CurrentValues {
  indexPrice: string;
  marketPrice: string;
  fpu: string;
  volume: string;
}

interface PriceChartProps {
  timeframe: string;
  onHover: (data: ChartData | null) => void;
}

const generateMockData = (days: number): ChartData[] => {
  const data = [];
  const now = new Date();
  const basePrice = 593.76;
  const baseVolume = 5050;
  const baseRate = 0.0744;
  const baseVelocity = -0.0033;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - (days - i) * 24 * 60 * 60 * 1000);
    const variance = Math.random() * 20 - 10;
    const marketVariance = variance + (Math.random() * 2 - 1);
    const rateVariance = (Math.random() * 0.4 - 0.2);
    const velocityVariance = (Math.random() * 0.2 - 0.1);
    
    data.push({
      date: date.toISOString(),
      indexPrice: basePrice + variance,
      marketPrice: basePrice + marketVariance,
      fpu: -271.622 + (Math.random() * 10 - 5),
      volume: baseVolume + (Math.random() * 1000 - 500),
      rate: baseRate + rateVariance,
      velocity: baseVelocity + velocityVariance
    });
  }
  return data;
};

const timeframeData: Record<string, ChartData[]> = {
  '1d': generateMockData(24),
  '1w': generateMockData(7),
  '1m': generateMockData(30),
  '3m': generateMockData(90),
  '6m': generateMockData(180),
  '1y': generateMockData(365),
  '5y': generateMockData(1825),
};

const timeframeOptions = [
  { label: '1 day', value: '1d' },
  { label: '1 week', value: '1w' },
  { label: '1 month', value: '1m' },
  { label: '3 months', value: '3m' },
  { label: '6 months', value: '6m' },
  { label: '1 year', value: '1y' },
  { label: '5 years', value: '5y' },
];

const metricOptions = [
  { 
    label: 'Index Price',
    value: 'indexPrice',
    color: '#22c55e',
    formatter: (value: number) => `$${value.toFixed(2)}`
  },
  { 
    label: 'Market Price',
    value: 'marketPrice',
    color: '#3b82f6',
    formatter: (value: number) => `$${value.toFixed(3)}`
  },
  { 
    label: 'FPU',
    value: 'fpu',
    color: '#f59e0b',
    formatter: (value: number) => value.toFixed(3)
  },
  { 
    label: 'Volume',
    value: 'volume',
    color: '#8b5cf6',
    formatter: (value: number) => `$${(value / 1000).toFixed(2)}K`
  },
];

const getTickCount = (tf: string) => {
  switch (tf) {
    case '1d': return 8;
    case '1w': return 7;
    case '1m': return 10;
    case '3m': return 6;
    case '6m': return 6;
    case '1y': return 6;
    case '5y': return 5;
    default: return 6;
  }
};

const getTimeframeLabel = (value: string): string => {
  const option = timeframeOptions.find(tf => tf.value === value);
  return option ? option.label : 'All';
};

function PriceChart({ timeframe: initialTimeframe, onHover }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('Pricing');
  const [selectedMetrics, setSelectedMetrics] = useState(['Index Price']);
  const [showVelocity, setShowVelocity] = useState(true);
  const [currentValues, setCurrentValues] = useState<CurrentValues>({
    indexPrice: '$593.76',
    marketPrice: '$593.768',
    fpu: '-271.622',
    volume: '$5.05K'
  });
  const [currentRate, setCurrentRate] = useState('0.0744');
  const [currentVelocity, setCurrentVelocity] = useState('-0.0033');

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    setShowDropdown(false);
  };

  const handleMouseMove = (data: any) => {
    if (data.activePayload?.[0]?.payload) {
      const payload = data.activePayload[0].payload as ChartData;
      setCurrentRate(payload.rate.toFixed(4));
      setCurrentVelocity(payload.velocity.toFixed(4));
      const newValues = {
        indexPrice: metricOptions[0].formatter(payload.indexPrice),
        marketPrice: metricOptions[1].formatter(payload.marketPrice),
        fpu: metricOptions[2].formatter(payload.fpu),
        volume: metricOptions[3].formatter(payload.volume)
      };
      setCurrentValues(newValues);
      onHover(payload);
    }
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  const isQuickTimeframe = (tf: string) => ['1d', '1w', '1m'].includes(tf);

  return (
    <div className="bg-[#111827] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('Pricing')}
            className={`text-sm font-medium border-b-2 pb-1 ${
              activeTab === 'Pricing'
                ? 'border-green-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveTab('Funding')}
            className={`text-sm font-medium border-b-2 pb-1 ${
              activeTab === 'Funding'
                ? 'border-green-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Funding
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {['1d', '1w', '1m'].map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                timeframe === tf 
                  ? 'bg-green-600/20 text-green-500' 
                  : 'text-gray-400 hover:bg-[#2a2e35] hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-gray-400 hover:bg-[#2a2e35] hover:text-white transition-colors"
            >
              {isQuickTimeframe(timeframe) ? 'All' : getTimeframeLabel(timeframe)}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-[#1f2937] rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeframeChange(option.value)}
                    className={`w-full px-6 py-2.5 text-left text-sm transition-colors ${
                      timeframe === option.value
                        ? 'bg-green-600/20 text-green-500'
                        : 'text-gray-400 hover:bg-[#2a2e35] hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'Pricing' ? (
        <div className="flex gap-4 mb-6">
          {metricOptions.map((metric) => (
            <button
              key={metric.value}
              onClick={() => toggleMetric(metric.label)}
              className="flex items-center gap-2"
            >
              <div className={`w-4 h-4 rounded border ${
                selectedMetrics.includes(metric.label)
                  ? `border-${metric.color.slice(1)} bg-${metric.color.slice(1)}/20`
                  : 'border-gray-600'
              }`}>
                <Check className={`w-3 h-3 ${
                  selectedMetrics.includes(metric.label) ? `text-${metric.color.slice(1)}` : 'text-transparent'
                }`} />
              </div>
              <span className="text-sm text-gray-400">{metric.label}</span>
              <span className="text-sm text-white">{currentValues[metric.value as keyof CurrentValues]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-gray-400 text-sm">Rate: </span>
            <span className="text-white text-sm">{currentRate}</span>
            <button 
              onClick={() => setShowVelocity(!showVelocity)}
              className="flex items-center gap-2"
            >
              <div className={`w-4 h-4 rounded border ${
                showVelocity ? 'border-yellow-500 bg-yellow-500/20' : 'border-gray-600'
              }`}>
                <Check className={`w-3 h-3 ${showVelocity ? 'text-yellow-500' : 'text-transparent'}`} />
              </div>
              <span className="text-gray-400 text-sm">Velocity: </span>
              <span className="text-white text-sm">{currentVelocity}</span>
            </button>
          </div>
        </div>
      )}

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'Funding' ? (
            <LineChart 
              data={timeframeData[timeframe]}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <Line
                type="linear"
                dataKey="rate"
                stroke="#fff"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {showVelocity && (
                <Line
                  type="linear"
                  dataKey="velocity"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              <XAxis 
                dataKey="date" 
                tickFormatter={(date: string) => {
                  const d = new Date(date);
                  return timeframe === '1d' 
                    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }}
                tick={{ fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                interval={Math.ceil(timeframeData[timeframe].length / getTickCount(timeframe))}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value: number) => value.toFixed(2) + '%'}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartData;
                    return (
                      <div className="bg-[#1a1d24] p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-white" />
                          <span className="text-gray-400">Rate:</span>
                          <span className="text-white">{data.rate.toFixed(4)}%</span>
                        </div>
                        {showVelocity && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-gray-400">Velocity:</span>
                            <span className="text-white">{data.velocity.toFixed(4)}%</span>
                          </div>
                        )}
                        <div className="text-gray-400 text-sm mt-2">
                          {new Date(data.date).toLocaleString()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </LineChart>
          ) : (
            <AreaChart 
              data={timeframeData[timeframe]}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {metricOptions.map((metric) => {
                if (!selectedMetrics.includes(metric.label)) return null;
                
                return (
                  <React.Fragment key={metric.value}>
                    <defs>
                      <linearGradient id={`color${metric.value}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metric.color} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey={metric.value}
                      stroke={metric.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#color${metric.value})`}
                      isAnimationActive={false}
                    />
                  </React.Fragment>
                );
              })}
              <XAxis 
                dataKey="date" 
                tickFormatter={(date: string) => {
                  const d = new Date(date);
                  return timeframe === '1d' 
                    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }}
                tick={{ fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                interval={Math.ceil(timeframeData[timeframe].length / getTickCount(timeframe))}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value: number) => `$${value.toFixed(2)}`}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartData;
                    return (
                      <div className="bg-[#1a1d24] p-3 rounded-lg">
                        {payload.map((entry) => {
                          const metric = metricOptions.find(m => m.value === entry.dataKey);
                          if (!metric || !entry.value) return null;
                          return (
                            <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
                              <span className="text-gray-400">{metric.label}:</span>
                              <span className="text-white">{metric.formatter(entry.value as number)}</span>
                            </div>
                          );
                        })}
                        <div className="text-gray-400 text-sm mt-2">
                          {new Date(data.date).toLocaleString()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PriceChart;