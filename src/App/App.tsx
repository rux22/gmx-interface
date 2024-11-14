import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Header } from '../components/Header';
import PriceChart from '../components/PriceChart';
import { MarketStats } from '../components/MarketStats';
import  {Footer}  from '../components/Footer';
import TradingTabs from '../components/TradingTabs';
import WalletConnect from '../components/WalletConnect';
import { TradingPanel } from '../components/TradingPanel';

interface MarketStatsType {
  marketPrice: number;
  volume24h: string;
  openInterest: {
    value: string;
    longPercentage: number;
    shortPercentage: number;
  };
  availableLiquidity: {
    long: string;
    short: string;
  };
  fundingVelocity: {
    rate: string;
    percentage: string;
  };
}

interface ChartDataPoint {
  marketPrice: number;
  date: string;
}

function App(): JSX.Element {
  const [timeLeft, setTimeLeft] = useState<number>(3600);
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [currentPrice, setCurrentPrice] = useState<number>(593.76);
  const [showPercentage, setShowPercentage] = useState<boolean>(true);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Positions');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleChartHover = (data: ChartDataPoint | null) => {
    if (data) {
      setHoverPrice(data.marketPrice);
      setShowPercentage(false);
    } else {
      setHoverPrice(null);
      setShowPercentage(true);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const marketStats: MarketStatsType = {
    marketPrice: currentPrice,
    volume24h: '$340.21K',
    openInterest: {
      value: '$2.04M',
      longPercentage: 50.14,
      shortPercentage: 49.85
    },
    availableLiquidity: {
      long: '$16.47M',
      short: '$16.48M'
    },
    fundingVelocity: {
      rate: '0.075%',
      percentage: '0.0008%'
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1d24] text-white flex flex-col">
      <Header
        timeLeft={timeLeft}
        totalTime={3600}
        formatTime={formatTime}
      />

      <main className="pt-16 flex flex-1">
        <aside className="w-16 fixed left-0 top-16 bottom-0 border-r border-gray-800 flex flex-col items-center py-4 gap-6">
          <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </aside>

        <div className="ml-16 flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">MB</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Miami Beach</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      ${hoverPrice?.toFixed(2) || currentPrice.toFixed(2)}
                    </span>
                    {showPercentage && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                        +1.85%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <MarketStats stats={marketStats} />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-1 bg-[#1f2937] rounded-lg p-6">
              <PriceChart 
                timeframe={timeframe} 
                onHover={handleChartHover}
              />
            </div>

            <div className="sticky top-24">
              <TradingPanel 
                currentPrice={currentPrice} 
                onConnectWallet={() => setIsWalletModalOpen(true)}
              />
            </div>
          </div>

          <TradingTabs activeTab={activeTab} onTabClick={handleTabClick} />
        </div>
      </main>

      <Footer />

      <WalletConnect 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </div>
  );
}

export default App;
