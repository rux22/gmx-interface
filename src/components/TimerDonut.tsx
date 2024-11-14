import React from 'react';

interface TimerDonutProps {
  timeLeft: number;
  totalTime: number;
}

export function TimerDonut({ timeLeft, totalTime }: TimerDonutProps) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / totalTime) * circumference;
  
  return (
    <div className="relative w-6 h-6">
      <svg className="transform -rotate-90 w-6 h-6">
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-700"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="text-green-400 transition-all duration-1000 ease-linear"
        />
      </svg>
    </div>
  );
}