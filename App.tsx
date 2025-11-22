
import React, { useState, useEffect } from 'react';
import { AppMode, THEMES, AppSettings } from './types';
import { Nav } from './components/Nav';
import { ClockView } from './views/ClockView';
import { AlarmView } from './views/AlarmView';
import { TimerView } from './views/TimerView';
import { PomodoroView } from './views/PomodoroView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';
import { setGlobalVolume } from './utils/sound';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CLOCK);
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : { is24Hour: true, volume: 1.0 };
  });

  useEffect(() => {
      localStorage.setItem('app_settings', JSON.stringify(settings));
      setGlobalVolume(settings.volume);
  }, [settings]);
  
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
        return <ClockView settings={settings} />;
      case AppMode.ALARM:
        return <AlarmView settings={settings} />;
      case AppMode.TIMER:
        return <TimerView />;
      case AppMode.POMODORO:
        return <PomodoroView />;
      case AppMode.TASKS:
        return <TasksView />;
      case AppMode.SETTINGS:
        return <SettingsView settings={settings} setSettings={setSettings} />;
      default:
        return <ClockView settings={settings} />;
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
