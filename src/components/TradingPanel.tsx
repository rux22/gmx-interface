import React, { useState } from 'react';
import classNames from 'classnames';

interface TradingPanelProps {
  currentPrice: number;
  onConnectWallet: () => void;
}

interface MarginInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  symbol?: string;
}

const MarginInput: React.FC<MarginInputProps> = ({ label, value, onChange, symbol = '$' }) => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <label className="text-sm text-gray-400">{label}:</label>
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-400">{symbol}</span>
        <span className="text-sm text-gray-400">0</span>
      </div>
    </div>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full bg-[#121212] rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
      placeholder={`${symbol}0.00`}
    />
  </div>
);

export function TradingPanel({ currentPrice, onConnectWallet }: TradingPanelProps): JSX.Element {
  const [tradeType, setTradeType] = useState<'long' | 'short'>('long');
  const [max, setMax] = useState<string>('0.00');
  const [size, setSize] = useState<string>('0.00');
  const [leverage, setLeverage] = useState<number>(1);

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMax(value);
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSize(value);
    }
  };

  const longButtonClasses = classNames(
    'flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 font-medium text-sm',
    {
      'bg-[#1B2A22] text-[#22C55E] hover:bg-[#1B2A22]/80': tradeType === 'long',
      'bg-[#1E1E1E] text-gray-400 hover:bg-[#2A2E35]': tradeType !== 'long',
    }
  );

  const shortButtonClasses = classNames(
    'flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 font-medium text-sm',
    {
      'bg-[#2A1F1F] text-[#EF4444] hover:bg-[#2A1F1F]/80': tradeType === 'short',
      'bg-[#1E1E1E] text-gray-400 hover:bg-[#2A2E35]': tradeType !== 'short',
    }
  );

  const tradingPanelClasses = classNames(
    'rounded-lg p-4 w-[320px] transition-colors duration-200',
    {
      'bg-[#0A0F1A] border border-[#22C55E]/20': tradeType === 'long',
      'bg-[#0A0F1A] border border-[#EF4444]/20': tradeType === 'short',
    }
  );

  const estimatedFillPrice = currentPrice * (tradeType === 'long' ? 1.002 : 0.998);

  return (
    <div className={tradingPanelClasses}>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTradeType('long')}
          className={longButtonClasses}
        >
          Long
        </button>
        <button
          onClick={() => setTradeType('short')}
          className={shortButtonClasses}
        >
          Short
        </button>
      </div>

      <div className="space-y-4">
        <MarginInput
          label="Max"
          value={max}
          onChange={handleMaxChange}
        />

        <MarginInput
          label="Size"
          value={size}
          onChange={handleSizeChange}
          symbol="○"
        />

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Est. Fill Price</span>
          <span className="text-gray-400">
            {Number(size) > 0 ? `$${estimatedFillPrice.toFixed(2)}` : '--'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Leverage</span>
          <span className="text-gray-400">{leverage}x</span>
        </div>

        <button
          onClick={onConnectWallet}
          className="w-full py-3 rounded-lg font-medium bg-[#4A4AFF] hover:bg-[#3A3AF0] text-white transition-colors duration-200"
        >
          Connect Wallet
        </button>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Slippage</span>
            <span className="text-gray-500">2.00%</span>
          </div>
          
          {Number(size) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Est. Liquidation Price</span>
              <span className="text-gray-500">
                ${(currentPrice * (tradeType === 'long' ? 0.8 : 1.2)).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}