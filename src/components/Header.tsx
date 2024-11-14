import React from 'react';
import { Search } from 'lucide-react';
import { TimerDonut } from './TimerDonut';

interface HeaderProps {
  timeLeft: number;
  totalTime: number;
  formatTime: (seconds: number) => string;
}

export function Header({ timeLeft, totalTime, formatTime }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Blur backdrop div - reduced opacity and blur */}
      <div className="absolute inset-0 backdrop-blur-sm bg-[#1a1d24]/10 border-b border-gray-800/30" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="https://app.gmx.io/assets/logo_GMX-1vZg6iUs.svg"
              alt="Logo"
              className="w-20 h-20"
              loading="eager"
            />
          </div>
          
          {/* Search Bar */}
          <SearchBar />
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <TimerDonut timeLeft={timeLeft} totalTime={totalTime} />
            <span className="text-white/70">Next update in:</span>
            <span className="font-mono text-white/70">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search markets..."
        className="w-[280px] h-9 pl-10 pr-4 rounded-lg bg-[#2a2e35]/40 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
      />
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-gray-400 bg-[#1a1d24]/40 rounded">
          CTRL + K
        </kbd>
      </div>
    </div>
  );
}