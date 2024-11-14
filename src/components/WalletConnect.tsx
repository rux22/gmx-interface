import React from 'react';
import { X } from 'lucide-react';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const wallets = {
    popular: [
      { name: 'Rabby Wallet', icon: '👛' },
      { name: 'MetaMask', icon: '🦊' },
      { name: 'WalletConnect', icon: '🔗' },
      { name: 'Browser Wallet', icon: '🌐' },
    ],
    others: [
      { name: 'Binance Web3 Wallet', icon: '💰' },
      { name: 'Coinbase Wallet', icon: '📱' },
      { name: 'Trust Wallet', icon: '🔒' },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1f2937] rounded-lg w-[400px] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Connect a Wallet</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-gray-400 text-sm mb-3">Popular</h3>
              <div className="space-y-2">
                {wallets.popular.map((wallet) => (
                  <button
                    key={wallet.name}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="text-white">{wallet.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm mb-3">Others</h3>
              <div className="space-y-2">
                {wallets.others.map((wallet) => (
                  <button
                    key={wallet.name}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="text-white">{wallet.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-gray-400">New to Ethereum wallets?</span>
            <button className="text-blue-400 hover:text-blue-300 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;