import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <img src="https://app.gmx.io/assets/ic_gmx_footer-B-PWPFTB.svg" alt="GMX Logo" className="w-24 h-24" />

          {/* Links and social icons */}
          <div className="flex items-center gap-8">
            <a href="https://twitter.com/GMX_IO" target="_blank" rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors">
              <img src="https://app.gmx.io/assets/ic_x-SalsBjgi.svg" alt="Twitter" className="w-6 h-6" />
            </a>
            <a href="https://gmx.io/docs" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors">
              <img src="https://app.gmx.io/assets/ic_substack-cKU4R-aP.svg" alt="Docs" className="w-6 h-6" />
            </a>
            <a href="https://github.com/gmx-io" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors">
              <img src="https://app.gmx.io/assets/ic_github-DbVsDctM.svg" alt="GitHub" className="w-6 h-6" />
            </a>
            <a href="https://discord.gg/gmx" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors">
              <img src="https://app.gmx.io/assets/ic_discord-C1SPMQM0.svg" alt="Discord" className="w-6 h-6" />
            </a>
          </div>

          {/* Additional links */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/media-kit" className="hover:text-white transition-colors">
              Media Kit
            </a>
            <a href="https://tradingview.com" target="_blank" rel="noopener noreferrer" 
              className="hover:text-white transition-colors">
              Charts by TradingView
            </a>
            <a href="/feedback" className="hover:text-white transition-colors">
              Leave feedback
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};