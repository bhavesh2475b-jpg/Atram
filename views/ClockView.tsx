
import React, { useState, useEffect } from 'react';

export const ClockView: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const dateString = time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  // Determine ambient colors based on hour of day
  const getAmbientColors = (h: number) => {
    if (h >= 5 && h < 12) return { start: 'bg-amber-500', end: 'bg-orange-400' }; // Morning: Warm
    if (h >= 12 && h < 17) return { start: 'bg-cyan-500', end: 'bg-blue-500' }; // Afternoon: Bright/Cool
    if (h >= 17 && h < 21) return { start: 'bg-fuchsia-500', end: 'bg-rose-500' }; // Evening: Sunset
    return { start: 'bg-indigo-600', end: 'bg-violet-800' }; // Night: Deep
  };

  const { start, end } = getAmbientColors(time.getHours());

  return (
    <div className="h-full relative flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500 overflow-hidden">
      
      {/* Time-reactive Ambient Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
         <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20 animate-pulse-slow transition-colors duration-[5000ms] ease-in-out ${start}`} />
         <div className={`absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-15 animate-pulse-slow delay-1000 transition-colors duration-[5000ms] ease-in-out ${end}`} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2 mb-12">
         <span className="text-onSurface/70 text-xl font-medium tracking-wide uppercase">{dateString}</span>
      </div>

      <div className="relative z-10 font-mono font-bold text-onSurface leading-none select-none tracking-tighter flex flex-col items-center">
         {/* Expressive Layout: Hours stacked on minutes for visual impact */}
        <div className="text-[12rem] sm:text-[16rem] text-primary leading-[0.8] transition-colors duration-500">
          {hours}
        </div>
        <div className="text-[12rem] sm:text-[16rem] text-onSurface leading-[0.8]">
          {minutes}
        </div>
         
         {/* Floating Seconds */}
        <div className="absolute top-1/2 -right-8 sm:-right-16 transform -translate-y-1/2 rotate-90 origin-center">
            <span className="inline-block text-4xl sm:text-6xl font-bold text-primaryContainer bg-onPrimaryContainer px-3 py-1 rounded-full animate-breathe shadow-lg">
                {seconds}
            </span>
        </div>
      </div>

      <div className="relative z-10 mt-16 flex gap-4">
        <div className="px-6 py-3 bg-surfaceContainer rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-onSurface font-medium">New York</span>
        </div>
      </div>
    </div>
  );
};
