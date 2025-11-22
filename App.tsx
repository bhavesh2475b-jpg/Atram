
import React, { useState, useEffect } from 'react';
import { AppMode, THEMES } from './types';
import { Nav } from './components/Nav';
import { ClockView } from './views/ClockView';
import { AlarmView } from './views/AlarmView';
import { TimerView } from './views/TimerView';
import { PomodoroView } from './views/PomodoroView';
import { TasksView } from './views/TasksView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CLOCK);
  
  // Apply theme colors to CSS variables whenever mode changes
  useEffect(() => {
    const theme = THEMES[mode];
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-on-primary', theme.onPrimary);
    root.style.setProperty('--color-primary-container', theme.primaryContainer);
    root.style.setProperty('--color-on-primary-container', theme.onPrimaryContainer);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-on-surface', theme.onSurface);
    root.style.setProperty('--color-surface-container', theme.surfaceContainer);
    
  }, [mode]);

  const renderView = () => {
    switch (mode) {
      case AppMode.CLOCK:
        return <ClockView />;
      case AppMode.ALARM:
        return <AlarmView />;
      case AppMode.TIMER:
        return <TimerView />;
      case AppMode.POMODORO:
        return <PomodoroView />;
      case AppMode.TASKS:
        return <TasksView />;
      default:
        return <ClockView />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface text-onSurface font-sans overflow-hidden relative selection:bg-primary selection:text-onPrimary transition-colors duration-500">
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primaryContainer opacity-20 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary opacity-10 blur-[120px] delay-1000" />
      </div>

      <main className="relative z-10 h-[calc(100vh-80px)] overflow-hidden">
        {renderView()}
      </main>

      <Nav currentMode={mode} setMode={setMode} />
    </div>
  );
};

export default App;
