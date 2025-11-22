
import React from 'react';
import { AppMode } from '../types';
import { Clock, AlarmClock, Timer, BrainCircuit, ListTodo, Settings } from 'lucide-react';
import { vibrate, HapticPatterns } from '../utils/haptics';

interface NavProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const Nav: React.FC<NavProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: AppMode.CLOCK, icon: Clock, label: 'Clock' },
    { mode: AppMode.ALARM, icon: AlarmClock, label: 'Alarm' },
    { mode: AppMode.TIMER, icon: Timer, label: 'Timer' },
    { mode: AppMode.POMODORO, icon: BrainCircuit, label: 'Focus' },
    { mode: AppMode.TASKS, icon: ListTodo, label: 'Tasks' },
    { mode: AppMode.SETTINGS, icon: Settings, label: 'Config' },
  ];

  const handlePress = (mode: AppMode) => {
    vibrate(HapticPatterns.light);
    setMode(mode);
  };

  return (
    <nav className="w-full p-4 pb-6 pointer-events-none">
      <div className="max-w-2xl mx-auto bg-surfaceContainer/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-3 flex justify-between items-center border border-white/5 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          const Icon = item.icon;
          return (
            <button
              key={item.mode}
              onClick={() => handlePress(item.mode)}
              className="group relative flex flex-col items-center justify-center w-full h-14"
            >
              {/* Active Indicator Pill */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-8 rounded-full transition-all duration-500 ease-spring ${
                isActive ? 'bg-primaryContainer scale-100' : 'bg-transparent scale-0'
              }`} />

              <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-onPrimaryContainer' : 'text-onSurface/50 group-hover:text-onSurface'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              
              {/* Optional Label - Hidden for purely expressive icon look, or minimal */}
              <span className={`text-[10px] font-bold mt-8 absolute opacity-0 transition-all duration-300 ${isActive ? 'translate-y-0 opacity-0' : 'translate-y-2 opacity-0'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
