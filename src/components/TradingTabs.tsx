import React, { useState } from 'react';
import { Filter, X, Download } from 'lucide-react';

interface TabProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
}

const TradingTabs: React.FC<TabProps> = ({ activeTab, onTabClick }) => {
  const [showMarketFilter, setShowMarketFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTypeText, setSearchTypeText] = useState('');

  const toggleMarketFilter = () => {
    setShowMarketFilter(!showMarketFilter);
    setShowTypeFilter(false);
  };

  const toggleTypeFilter = () => {
    setShowTypeFilter(!showTypeFilter);
    setShowMarketFilter(false);
  };

  const marketsList = [
    {
      name: 'BTC/USD',
      variations: [
        { symbol: 'BTC-USDC', icon: '🟡' },
        { symbol: 'BTC', icon: '🟡' },
        { symbol: 'tBTC', icon: '🟡' },
      ]
    },
    {
      name: 'ETH/USD',
      variations: [
        { symbol: 'WETH-USDC', icon: '⚪' },
        { symbol: 'WETH', icon: '⚪' },
        { symbol: 'watETH-USDe', icon: '⚪' },
      ]
    },
    {
      name: 'SOL/USD',
      variations: [
        { symbol: 'SOL-USDC', icon: '▪️' },
      ]
    },
    {
      name: 'DOGE/USD',
      variations: [
        { symbol: 'WETH-USDC', icon: '🟡' },
      ]
    },
    {
      name: 'LINK/USD',
      variations: [
        { symbol: 'LINK-USDC', icon: '🔵' },
      ]
    },
    {
      name: 'WIF/USD',
      variations: [
        { symbol: 'WIF-USDC', icon: '⚪' },
      ]
    },
    {
      name: 'SUI/USD',
      variations: [
        { symbol: 'WETH-USDC', icon: '🔷' },
      ]
    },
    {
      name: 'GMX/USD',
      variations: [
        { symbol: 'GMX-USDC', icon: '▲' },
      ]
    },
    {
      name: 'AAVE/USD',
      variations: [
        { symbol: 'AAVE-USDC', icon: '🟣' },
      ]
    }
  ];

  return (
    <>
      <div className="flex border-b border-gray-800">
        <div
          className={`px-6 py-4 cursor-pointer ${
            activeTab === 'Positions' ? 'text-white font-bold' : 'text-gray-400'
          }`}
          onClick={() => onTabClick('Positions')}
        >
          Positions
        </div>
        <div
          className={`px-6 py-4 cursor-pointer ${
            activeTab === 'Orders' ? 'text-white font-bold' : 'text-gray-400'
          }`}
          onClick={() => onTabClick('Orders')}
        >
          Orders
        </div>
        <div
          className={`px-6 py-4 cursor-pointer ${
            activeTab === 'Trades' ? 'text-white font-bold' : 'text-gray-400'
          }`}
          onClick={() => onTabClick('Trades')}
        >
          Trades
        </div>
        <div
          className={`px-6 py-4 cursor-pointer ${
            activeTab === 'Claims' ? 'text-white font-bold' : 'text-gray-400'
          }`}
          onClick={() => onTabClick('Claims')}
        >
          Claims
        </div>
      </div>

      {activeTab === 'Positions' && (
        <div className="bg-[#1f2937] rounded-lg p-3 mt-3">
          <div className="grid grid-cols-7 gap-4 text-gray-400">
            <div>POSITION</div>
            <div>SIZE</div>
            <div>NET VALUE</div>
            <div>COLLATERAL</div>
            <div>ENTRY PRICE</div>
            <div>MARK PRICE</div>
            <div>LIQ. PRICE</div>
          </div>
          <div className="grid grid-cols-7">
            <div className="py-4 text-gray-400 text-sm">No open positions</div>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="bg-[#1f2937] rounded-lg p-3 mt-3">
          <div className="grid grid-cols-5 gap-4 text-gray-400 border-b border-gray-800">
            <div className="relative">
              <div 
                className="flex items-center gap-1 cursor-pointer group"
                onClick={toggleMarketFilter}
              >
                <span className="group-hover:text-[#7e9dfe] transition-colors">MARKET</span>
                <Filter className="w-3 h-3 text-gray-500 group-hover:text-[#7e9dfe] transition-colors" />
              </div>
              
              {showMarketFilter && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#1f2937] border border-gray-800 rounded-lg shadow-lg z-10">
                  <div className="p-2 relative">
                    <input
                      type="text"
                      placeholder="Search Market"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#171e2e] text-gray-300 p-2 pl-8 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Filter className="w-4 h-4 text-gray-500" />
                    </div>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
                      </button>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-800">
                    <button className="text-gray-400 text-sm hover:text-white w-full text-left p-1">
                      Clear selection
                    </button>
                  </div>
                  <div className="p-2 border-t border-gray-800">
                    <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                      <input type="checkbox" className="form-checkbox" />
                      Direction
                    </label>
                    <div className="pl-6">
                      <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                        <input type="checkbox" className="form-checkbox" />
                        Longs
                      </label>
                      <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                        <input type="checkbox" className="form-checkbox" />
                        Shorts
                      </label>
                    </div>
                    <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                      <input type="checkbox" className="form-checkbox" />
                      Swaps
                    </label>
                    <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                      <input type="checkbox" className="form-checkbox" />
                      Markets
                    </label>
                    <div className="pl-6 max-h-48 overflow-y-auto">
                      {marketsList.map((market, index) => (
                        <div key={index}>
                          {market.variations.map((variation, vIndex) => (
                            <label key={vIndex} className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                              <input type="checkbox" className="form-checkbox" />
                              <span className="flex items-center gap-2">
                                <span className="text-base">{variation.icon}</span>
                                <span>{market.name} [{variation.symbol}]</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <div 
                className="flex items-center gap-1 cursor-pointer group"
                onClick={toggleTypeFilter}
              >
                <span className="group-hover:text-[#7e9dfe] transition-colors">TYPE</span>
                <Filter className="w-3 h-3 text-gray-500 group-hover:text-[#7e9dfe] transition-colors" />
              </div>

              {showTypeFilter && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#1f2937] border border-gray-800 rounded-lg shadow-lg z-10">
                  <div className="p-2 relative">
                    <input
                      type="text"
                      placeholder="Search Type"
                      value={searchTypeText}
                      onChange={(e) => setSearchTypeText(e.target.value)}
                      className="w-full bg-[#171e2e] text-gray-300 p-2 pl-8 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Filter className="w-4 h-4 text-gray-500" />
                    </div>
                    {searchTypeText && (
                      <button 
                        onClick={() => setSearchTypeText('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
                      </button>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-800">
                    <button className="text-gray-400 text-sm hover:text-white w-full text-left p-1">
                      Clear selection
                    </button>
                  </div>
                  <div className="p-2 border-t border-gray-800">
                    <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                      <input type="checkbox" className="form-checkbox" />
                      Trigger Orders
                    </label>
                    <div className="pl-6">
                      <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                        <input type="checkbox" className="form-checkbox" />
                        Limit
                      </label>
                      <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                        <input type="checkbox" className="form-checkbox" />
                        Take-Profit
                      </label>
                      <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                        <input type="checkbox" className="form-checkbox" />
                        Stop-Loss
                      </label>
                    </div>
                    <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                      <input type="checkbox" className="form-checkbox" />
                      Swaps
                    </label>
                    <div className="pl-6">
                      <label className="flex items-center gap-2 p-1 text-gray-400 text-sm hover:bg-gray-800">
                        <input type="checkbox" className="form-checkbox" />
                        Swap
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>SIZE</div>
            <div>TRIGGER PRICE</div>
            <div>MARK PRICE</div>
          </div>
          <div className="py-4 text-gray-400 text-sm">
            No open orders
          </div>
        </div>
      )}

      {activeTab === 'Trades' && (
        <div className="bg-[#1f2937] rounded-lg p-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-white font-bold">Trade History</div>
            <div className="flex gap-3">
              <button className="px-3 py-1 text-sm text-gray-400 border border-gray-700 rounded hover:border-gray-600">
                All time
              </button>
              <button className="px-3 py-1 text-sm text-gray-400 border border-gray-700 rounded hover:border-gray-600 flex items-center gap-1">
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4 text-gray-400 border-b border-gray-800 pb-2">
            <div className="relative">
              <div className="flex items-center gap-1 cursor-pointer group">
                <span className="group-hover:text-[#7e9dfe] transition-colors">ACTION</span>
                <Filter className="w-3 h-3 text-gray-500 group-hover:text-[#7e9dfe] transition-colors" />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-1 cursor-pointer group">
                <span className="group-hover:text-[#7e9dfe] transition-colors">MARKET</span>
                <Filter className="w-3 h-3 text-gray-500 group-hover:text-[#7e9dfe] transition-colors" />
              </div>
            </div>
            <div>SIZE</div>
            <div>PRICE</div>
            <div>TIME</div>
            <div>RPNL ($)</div>
          </div>
          <div className="py-4 text-gray-400 text-sm">
            No trades yet
          </div>
        </div>
      )}

      {activeTab === 'Claims' && (
        <div className="bg-[#1f2937] rounded-lg p-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-white font-bold">Claims History</div>
            <div className="flex gap-3">
              <button className="px-3 py-1 text-sm text-gray-400 border border-gray-700 rounded hover:border-gray-600">
                All time
              </button>
              <button className="px-3 py-1 text-sm text-gray-400 border border-gray-700 rounded hover:border-gray-600 flex items-center gap-1">
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-gray-400 border-b border-gray-800 pb-2">
            <div className="relative">
              <div className="flex items-center gap-1 cursor-pointer group">
                <span className="group-hover:text-[#7e9dfe] transition-colors">ACTION</span>
                <Filter className="w-3 h-3 text-gray-500 group-hover:text-[#7e9dfe] transition-colors" />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-1 cursor-pointer group">
                <span className="group-hover:text-[#7e9dfe] transition-colors">MARKET</span>
                <Filter className="w-3 h-3 text-gray-500 group-hover:text-[#7e9dfe] transition-colors" />
              </div>
            </div>
            <div>SIZE</div>
          </div>
          <div className="py-4 text-gray-400 text-sm">
            No claims yet
          </div>
        </div>
      )}
    </>
  );
};

export default TradingTabs;