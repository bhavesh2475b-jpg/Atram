
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
    <nav className="fixed bottom-0 left-0 right-0 p-4 z-50">
      <div className="max-w-2xl mx-auto bg-surfaceContainer/90 backdrop-blur-xl rounded-[2rem] shadow-lg p-2 flex justify-between items-center border border-white/5">
        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          const Icon = item.icon;
          return (
            <button
              key={item.mode}
              onClick={() => handlePress(item.mode)}
              className={`relative flex flex-col items-center justify-center w-full h-16 rounded-[1.5rem] transition-all duration-300 ${
                isActive ? 'bg-primaryContainer text-onPrimaryContainer' : 'text-onSurface/60 hover:text-onSurface hover:bg-white/5'
              }`}
            >
              <span className={`transform transition-transform duration-300 ${isActive ? '-translate-y-1' : 'translate-y-0'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className={`text-[9px] font-medium mt-1 absolute bottom-2 opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
