
import React, { useState, useEffect } from 'react';
import { PomodoroMode } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair, Settings, X } from 'lucide-react';
import { playNotificationSound } from '../utils/sound';

export const PomodoroView: React.FC = () => {
  const [durations, setDurations] = useState<Record<PomodoroMode, number>>(() => {
    const saved = localStorage.getItem('pomodoro_durations');
    return saved ? JSON.parse(saved) : {
      [PomodoroMode.FOCUS]: 25,
      [PomodoroMode.SHORT_BREAK]: 5,
      [PomodoroMode.LONG_BREAK]: 15,
    };
  });

  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_cycles');
    return saved ? parseInt(saved) : 4;
  });

  const [mode, setMode] = useState<PomodoroMode>(PomodoroMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(durations[PomodoroMode.FOCUS] * 60);
  const [isActive, setIsActive] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('pomodoro_durations', JSON.stringify(durations));
  }, [durations]);

  useEffect(() => {
    localStorage.setItem('pomodoro_cycles', cyclesBeforeLongBreak.toString());
  }, [cyclesBeforeLongBreak]);

  const config = {
    [PomodoroMode.FOCUS]: { color: 'bg-primaryContainer', icon: Brain },
    [PomodoroMode.SHORT_BREAK]: { color: 'bg-emerald-800', icon: Coffee },
    [PomodoroMode.LONG_BREAK]: { color: 'bg-blue-800', icon: Armchair },
  };

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                playNotificationSound();
                setIsActive(false);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const switchMode = (newMode: PomodoroMode) => {
      setMode(newMode);
      setIsActive(false);
      setTimeLeft(durations[newMode] * 60);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
      setIsActive(false);
      setTimeLeft(durations[mode] * 60);
  };

  const handleDurationChange = (targetMode: PomodoroMode, value: number) => {
      setDurations(prev => ({
          ...prev,
          [targetMode]: value
      }));
      if (targetMode === mode && !isActive) {
          setTimeLeft(value * 60);
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const ModeIcon = config[mode].icon;

  return (
    <div className="h-full flex flex-col items-center p-6 w-full max-w-md mx-auto animate-in zoom-in-95 duration-500 relative">
      
      {/* Header / Settings Toggle */}
      <div className="w-full flex justify-end mb-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 rounded-full hover:bg-surfaceContainer text-onSurface/60 hover:text-onSurface transition-all flex items-center justify-center hover:rotate-45"
            aria-label="Settings"
          >
            <Settings size={28} />
          </button>
      </div>

      {/* Mode Switcher Pills */}
      <div className="flex bg-surfaceContainer rounded-[2rem] p-2 mb-8 w-full relative h-16 shadow-inner">
          <div 
            className="absolute top-2 bottom-2 rounded-[1.5rem] bg-primary transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style={{
                left: mode === PomodoroMode.FOCUS ? '8px' : mode === PomodoroMode.SHORT_BREAK ? '34%' : '67%',
                width: '32%' 
            }}
          />
          
          {Object.values(PomodoroMode).map((m) => (
              <button 
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-full text-sm font-bold z-10 transition-colors duration-300 text-center truncate ${mode === m ? 'text-onPrimary' : 'text-onSurface/60 hover:text-onSurface'}`}
              >
                {m}
              </button>
          ))}
      </div>

      {/* Timer Display Card */}
      <div className={`w-full aspect-[4/5] rounded-[3.5rem] ${config[mode].color} transition-all duration-700 ease-in-out flex flex-col items-center justify-center relative overflow-hidden shadow-2xl ring-8 ring-surfaceContainer/50`}>
          
          <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-[80px] animate-pulse-slow"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black rounded-full blur-[80px] animate-pulse-slow delay-700"></div>
          </div>

          <div className="z-10 flex flex-col items-center">
            <div className="mb-8 p-6 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-lg">
                <ModeIcon size={48} className="text-onPrimaryContainer opacity-90" />
            </div>
            
            <div className="text-[7rem] font-mono font-bold text-onPrimaryContainer tracking-tighter leading-none mb-6 drop-shadow-sm">
                {formatTime(timeLeft)}
            </div>
            
            <p className="text-onPrimaryContainer/70 font-bold text-xl tracking-wider uppercase opacity-80">
                {isActive ? 'Stay Focused' : 'Ready?'}
            </p>
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 flex gap-6 z-20 items-center">
              <button onClick={resetTimer} className="w-16 h-16 rounded-[1.5rem] bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-onPrimaryContainer transition-all hover:scale-110 active:scale-95">
                  <RotateCcw size={24} />
              </button>
              <button onClick={toggleTimer} className="w-28 h-20 rounded-[2.5rem] bg-onPrimaryContainer text-primaryContainer flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95 active:shadow-inner">
                  {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
              </button>
          </div>
      </div>

      {/* Session Dots */}
      <div className="mt-8 flex flex-col items-center">
          <span className="text-onSurface/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">Session Progress</span>
          <div className="flex gap-3 flex-wrap justify-center max-w-xs">
             {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => {
                 const dotIndex = i + 1;
                 return (
                     <div key={dotIndex} className={`w-4 h-4 rounded-full transition-all duration-500 ${dotIndex <= cycle ? 'bg-primary scale-110' : 'bg-surfaceContainer scale-100'}`} />
                 );
             })}
          </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-surface w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-20 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl text-onSurface font-medium">Timer Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="p-3 rounded-full hover:bg-surfaceContainer text-onSurface/60 hover:text-onSurface transition-colors">
                        <X size={28} />
                    </button>
                </div>
                
                <div className="space-y-8">
                    {Object.values(PomodoroMode).map((m) => (
                        <div key={m} className="space-y-4">
                            <div className="flex justify-between text-onSurface font-medium items-end">
                                <span className="text-lg text-onSurface/80">{m}</span>
                                <span className="text-2xl font-mono text-primary font-bold">{durations[m]} <span className="text-sm text-onSurface/40 font-sans font-normal">min</span></span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="60" 
                                value={durations[m]} 
                                onChange={(e) => handleDurationChange(m, parseInt(e.target.value))}
                                className="w-full h-4 bg-surfaceContainer rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                            />
                        </div>
                    ))}

                    <div className="h-px bg-surfaceContainer w-full my-4"></div>

                    {/* Cycles Setting */}
                    <div className="space-y-4">
                        <div className="flex justify-between text-onSurface font-medium items-end">
                            <span className="text-lg text-onSurface/80">Cycles before Long Break</span>
                            <span className="text-2xl font-mono text-primary font-bold">{cyclesBeforeLongBreak}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={cyclesBeforeLongBreak} 
                            onChange={(e) => setCyclesBeforeLongBreak(parseInt(e.target.value))}
                            className="w-full h-4 bg-surfaceContainer rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                        />
                    </div>
                </div>

                <button 
                    onClick={() => setShowSettings(false)} 
                    className="mt-12 w-full py-5 rounded-[2rem] bg-primary text-onPrimary font-bold shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                    Save Changes
                </button>
            </div>
        </div>
      )}

    </div>
  );
};
