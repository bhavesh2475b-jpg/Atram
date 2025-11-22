
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PomodoroMode, PomodoroStat, Task } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair, Settings, X, BarChart3, Timer, Flame, Trophy, Lightbulb, ListTodo, Save, CheckCircle2 } from 'lucide-react';
import { playNotificationSound } from '../utils/sound';
import { vibrate, HapticPatterns } from '../utils/haptics';

export const PomodoroView: React.FC = () => {
  // --- STATE INITIALIZATION ---
  const [durations, setDurations] = useState<Record<PomodoroMode, number>>(() => {
    const saved = localStorage.getItem('pomodoro_durations');
    return saved ? JSON.parse(saved) : {
      [PomodoroMode.FOCUS]: 25,
      [PomodoroMode.SHORT_BREAK]: 5,
      [PomodoroMode.LONG_BREAK]: 15,
    };
  });

  const [stats, setStats] = useState<PomodoroStat[]>(() => {
    const saved = localStorage.getItem('pomodoro_stats');
    let parsed = saved ? JSON.parse(saved) : [];
    parsed = parsed.map((s: any) => ({ ...s, sessions: s.sessions ?? Math.ceil(s.minutes / 25) }));
    return parsed;
  });

  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_cycles');
    return saved ? parseInt(saved) : 4;
  });

  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'timer' | 'stats'>('timer');
  const [showSettings, setShowSettings] = useState(false);

  // Timer State
  const [mode, setMode] = useState<PomodoroMode>(PomodoroMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(durations[PomodoroMode.FOCUS] * 60);
  const [isActive, setIsActive] = useState(false);
  const [cycle, setCycle] = useState(1);
  
  // Ref to track the end timestamp for background accuracy
  const endTimeRef = useRef<number | null>(null);

  // --- PERSISTENCE & RESTORATION LOGIC ---

  // Restore Timer State on Mount
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoro_state');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        setMode(parsed.mode);
        setCycle(parsed.cycle);
        setSelectedTaskId(parsed.selectedTaskId || null);
        
        if (parsed.isActive && parsed.endTime) {
            const now = Date.now();
            const remaining = Math.ceil((parsed.endTime - now) / 1000);
            
            if (remaining > 0) {
                // Resume active timer
                setTimeLeft(remaining);
                setIsActive(true);
                endTimeRef.current = parsed.endTime;
            } else {
                // Timer finished while away
                handleTimerComplete(parsed.mode, parsed.cycle, parsed.selectedTaskId);
                setIsActive(false);
                setTimeLeft(0);
                endTimeRef.current = null;
                // Clear invalid state
                localStorage.removeItem('pomodoro_state');
            }
        } else {
            // Restore paused state
            setIsActive(false);
            setTimeLeft(parsed.timeLeft);
        }
    }
    // Load Tasks
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        const parsed: Task[] = JSON.parse(savedTasks);
        setAvailableTasks(parsed.filter(t => !t.completed));
    }
  }, []);

  // Save Timer State whenever it changes
  useEffect(() => {
    const state = {
        mode,
        timeLeft,
        isActive,
        endTime: endTimeRef.current,
        cycle,
        selectedTaskId
    };
    localStorage.setItem('pomodoro_state', JSON.stringify(state));
  }, [mode, timeLeft, isActive, cycle, selectedTaskId]);

  // Persist Settings
  useEffect(() => { localStorage.setItem('pomodoro_durations', JSON.stringify(durations)); }, [durations]);
  useEffect(() => { localStorage.setItem('pomodoro_cycles', cyclesBeforeLongBreak.toString()); }, [cyclesBeforeLongBreak]);
  useEffect(() => { localStorage.setItem('pomodoro_stats', JSON.stringify(stats)); }, [stats]);


  // --- TIMER LOGIC ---

  const logSession = (minutes: number, currentMode: PomodoroMode, taskId: string | null) => {
    if (currentMode !== PomodoroMode.FOCUS) return;

    const today = new Date().toISOString().split('T')[0];
    
    // 1. Update Global Stats
    setStats(prev => {
        const existing = prev.find(s => s.date === today);
        if (existing) {
            return prev.map(s => s.date === today ? { 
                ...s, 
                minutes: s.minutes + minutes,
                sessions: (s.sessions || 0) + 1
            } : s);
        }
        const newStats = [...prev, { date: today, minutes, sessions: 1 }];
        return newStats.slice(-30);
    });

    // 2. Update Task Time
    if (taskId) {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const allTasks: Task[] = JSON.parse(savedTasks);
            const updatedTasks = allTasks.map(t => {
                if (t.id === taskId) {
                    return { ...t, timeSpent: (t.timeSpent || 0) + minutes };
                }
                return t;
            });
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
            setAvailableTasks(updatedTasks.filter(t => !t.completed));
        }
    }
  };

  const handleTimerComplete = (currentMode: PomodoroMode, currentCycle: number, taskId: string | null) => {
      playNotificationSound();
      vibrate(HapticPatterns.success);
      
      if (currentMode === PomodoroMode.FOCUS) {
          // Log the session using the configured duration
          // Note: We use durations state, but if restored from background, strictly we should use the duration from when it started.
          // For simplicity, we assume settings haven't changed mid-timer.
          const mins = durations[PomodoroMode.FOCUS]; 
          logSession(mins, currentMode, taskId);
          setCycle(c => c < cyclesBeforeLongBreak ? c + 1 : 1);
      }
  };

  // The Interval Loop
  useEffect(() => {
    let interval: number | undefined;
    
    if (isActive && endTimeRef.current) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((endTimeRef.current! - now) / 1000);

        if (remaining <= 0) {
            // Timer Finished
            setTimeLeft(0);
            setIsActive(false);
            endTimeRef.current = null;
            handleTimerComplete(mode, cycle, selectedTaskId);
            localStorage.removeItem('pomodoro_state'); // Clear active state
        } else {
            setTimeLeft(remaining);
        }
      }, 200); // Check more frequently for smoothness, logic relies on timestamp
    }

    return () => clearInterval(interval);
  }, [isActive, mode, cycle, selectedTaskId, durations, cyclesBeforeLongBreak]);


  // --- CONTROLS ---

  const toggleTimer = () => {
      vibrate(HapticPatterns.medium);
      if (isActive) {
          // Pause: Calculate remaining time and clear target
          setIsActive(false);
          endTimeRef.current = null;
      } else {
          // Start: Set target based on current timeLeft
          const target = Date.now() + (timeLeft * 1000);
          endTimeRef.current = target;
          setIsActive(true);
      }
  };

  const switchMode = (newMode: PomodoroMode) => {
      setMode(newMode);
      setIsActive(false);
      endTimeRef.current = null;
      setTimeLeft(durations[newMode] * 60);
      vibrate(HapticPatterns.light);
  };
  
  const resetTimer = () => {
      setIsActive(false);
      endTimeRef.current = null;
      setTimeLeft(durations[mode] * 60);
      vibrate(HapticPatterns.medium);
      localStorage.removeItem('pomodoro_state');
  };

  const saveProgress = () => {
      const totalDuration = durations[mode] * 60;
      const elapsedSeconds = totalDuration - timeLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);

      if (elapsedMinutes >= 1) {
          logSession(elapsedMinutes, mode, selectedTaskId);
          vibrate(HapticPatterns.success);
          alert(`Saved ${elapsedMinutes} minutes of focus.`);
      } else {
          alert("Session too short to save (min 1 minute).");
      }
      resetTimer();
  };

  const handleDurationChange = (targetMode: PomodoroMode, value: number) => {
      setDurations(prev => ({ ...prev, [targetMode]: value }));
      if (targetMode === mode && !isActive) {
          setTimeLeft(value * 60);
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const config = {
    [PomodoroMode.FOCUS]: { color: 'bg-primaryContainer', icon: Brain },
    [PomodoroMode.SHORT_BREAK]: { color: 'bg-emerald-800', icon: Coffee },
    [PomodoroMode.LONG_BREAK]: { color: 'bg-blue-800', icon: Armchair },
  };

  // --- STATS MEMO ---
  const weeklyData = useMemo(() => {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const stat = stats.find(s => s.date === dateStr);
          days.push({ 
              name: dayName, 
              minutes: stat ? stat.minutes : 0, 
              sessions: stat ? stat.sessions : 0 
          });
      }
      return days;
  }, [stats]);

  const totalWeeklyMinutes = weeklyData.reduce((acc, curr) => acc + curr.minutes, 0);
  const totalWeeklySessions = weeklyData.reduce((acc, curr) => acc + curr.sessions, 0);
  const maxMins = Math.max(...weeklyData.map(d => d.minutes), 60);
  
  const getSuggestion = () => {
      const avgMins = totalWeeklyMinutes / 7;
      if (totalWeeklyMinutes === 0) return "Start with just one session today to build momentum.";
      if (avgMins > 120) return "Excellent focus! Remember to take longer breaks to prevent burnout.";
      if (avgMins > 60) return "Great consistency. Try increasing your session duration slightly.";
      if (totalWeeklySessions > 10) return "You're a session machine! Consistency is your superpower.";
      return "Short, consistent sessions are better than long, irregular ones.";
  };

  const ModeIcon = config[mode].icon;
  const selectedTask = availableTasks.find(t => t.id === selectedTaskId);

  return (
    <div className="min-h-full w-full max-w-md mx-auto p-6 flex flex-col items-center animate-in zoom-in-95 duration-500 relative pb-32">
      
      {/* Header Controls */}
      <div className="w-full flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-2xl font-bold text-onSurface transition-all">
              {viewMode === 'timer' ? 'Focus Timer' : 'Weekly Stats'}
          </h2>
          <div className="flex gap-2">
            <button 
                onClick={() => { setViewMode(prev => prev === 'timer' ? 'stats' : 'timer'); vibrate(HapticPatterns.light); }}
                className="w-12 h-12 rounded-full bg-surfaceContainer text-onSurface hover:bg-primaryContainer hover:text-onPrimaryContainer transition-all flex items-center justify-center"
                aria-label="Toggle View"
            >
                {viewMode === 'timer' ? <BarChart3 size={24} /> : <Timer size={24} />}
            </button>
            <button 
                onClick={() => { setShowSettings(true); vibrate(HapticPatterns.light); }}
                className="w-12 h-12 rounded-full hover:bg-surfaceContainer text-onSurface/60 hover:text-onSurface transition-all flex items-center justify-center hover:rotate-45"
                aria-label="Settings"
            >
                <Settings size={28} />
            </button>
          </div>
      </div>

      {viewMode === 'timer' ? (
        /* --- TIMER VIEW --- */
        <div className="w-full flex flex-col items-center animate-in slide-in-from-left-8 duration-300">
            {/* Mode Switcher Pills */}
            <div className="flex bg-surfaceContainer rounded-[2rem] p-2 mb-4 w-full relative h-16 shadow-inner shrink-0">
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

            {/* Task Selector */}
            {mode === PomodoroMode.FOCUS && (
                <button 
                    onClick={() => { setShowTaskSelector(true); vibrate(HapticPatterns.light); }}
                    className={`mb-6 px-4 py-2 rounded-full flex items-center gap-2 transition-all max-w-[90%] shrink-0 ${selectedTask ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-surfaceContainer text-onSurface/50 hover:bg-surfaceContainer/80'}`}
                >
                    {selectedTask ? <CheckCircle2 size={16} className="shrink-0" /> : <ListTodo size={16} className="shrink-0" />}
                    <span className="truncate font-medium text-sm">
                        {selectedTask ? selectedTask.text : 'Link to a Task'}
                    </span>
                    {selectedTask && <X size={14} className="ml-2 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setSelectedTaskId(null); }} />}
                </button>
            )}

            {/* Timer Display Card */}
            <div className={`w-full aspect-[4/5] rounded-[3.5rem] ${config[mode].color} transition-all duration-700 ease-in-out flex flex-col items-center justify-center relative overflow-hidden shadow-2xl ring-8 ring-surfaceContainer/50`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-[80px] animate-pulse-slow"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black rounded-full blur-[80px] animate-pulse-slow delay-700"></div>
                </div>

                <div className="z-10 flex flex-col items-center">
                    <div className="mb-8 p-6 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-lg">
                        <ModeIcon size={48} className="text-onPrimaryContainer opacity-90" />
                    </div>
                    
                    <div className="text-[6rem] sm:text-[7rem] font-mono font-bold text-onPrimaryContainer tracking-tighter leading-none mb-6 drop-shadow-sm">
                        {formatTime(timeLeft)}
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                        {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => {
                            const dotIndex = i + 1;
                            return (
                                <div key={dotIndex} className={`w-3 h-3 rounded-full transition-all duration-500 ${dotIndex <= cycle ? 'bg-onPrimaryContainer scale-110' : 'bg-onPrimaryContainer/30'}`} />
                            );
                        })}
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 flex gap-6 z-20 items-center">
                    {!isActive && timeLeft !== durations[mode] * 60 ? (
                         /* Paused State Controls */
                        <>
                            <button onClick={resetTimer} className="w-16 h-16 rounded-[1.5rem] bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-onPrimaryContainer transition-all hover:scale-110 active:scale-95">
                                <RotateCcw size={24} />
                            </button>
                            <button onClick={saveProgress} className="w-28 h-20 rounded-[2.5rem] bg-white text-primaryContainer flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95 gap-2">
                                <Save size={24} fill="currentColor" />
                                <span className="font-bold">Save</span>
                            </button>
                        </>
                    ) : (
                        /* Default Controls */
                        <>
                            <button onClick={resetTimer} className={`w-16 h-16 rounded-[1.5rem] bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-onPrimaryContainer transition-all hover:scale-110 active:scale-95 ${isActive ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <RotateCcw size={24} />
                            </button>
                            <button onClick={toggleTimer} className="w-28 h-20 rounded-[2.5rem] bg-onPrimaryContainer text-primaryContainer flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95 active:shadow-inner">
                                {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      ) : (
        /* --- STATS VIEW --- */
        <div className="w-full flex flex-col gap-4 animate-in slide-in-from-right-8 duration-300">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surfaceContainer rounded-[2rem] p-5 flex flex-col justify-between gap-4">
                     <div className="p-3 bg-primary/10 w-fit rounded-full text-primary">
                         <Flame size={24} />
                     </div>
                     <div>
                         <span className="text-3xl font-bold text-onSurface tracking-tight">{(totalWeeklyMinutes / 60).toFixed(1)}</span>
                         <span className="text-sm text-onSurface/50 font-medium ml-1">hrs</span>
                         <p className="text-onSurface/60 text-xs font-bold uppercase tracking-wider mt-1">Focus Time</p>
                     </div>
                </div>
                <div className="bg-surfaceContainer rounded-[2rem] p-5 flex flex-col justify-between gap-4">
                     <div className="p-3 bg-amber-500/10 w-fit rounded-full text-amber-500">
                         <Trophy size={24} />
                     </div>
                     <div>
                         <span className="text-3xl font-bold text-onSurface tracking-tight">{totalWeeklySessions}</span>
                         <span className="text-sm text-onSurface/50 font-medium ml-1">cnt</span>
                         <p className="text-onSurface/60 text-xs font-bold uppercase tracking-wider mt-1">Sessions</p>
                     </div>
                </div>
            </div>

            {/* Chart Card */}
            <div className="bg-surfaceContainer rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-lg text-onSurface">Activity</h3>
                    <span className="text-xs font-bold bg-onSurface/5 text-onSurface/60 px-2 py-1 rounded-md uppercase">Last 7 Days</span>
                </div>
                
                <div className="flex justify-between items-end h-48 gap-2 px-1">
                    {weeklyData.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 group cursor-default">
                             <div className="relative w-full flex items-end justify-center h-full">
                                 <div 
                                    className={`w-full rounded-t-lg transition-all duration-700 ease-out ${stat.minutes > 0 ? 'bg-primary opacity-90 group-hover:opacity-100' : 'bg-onSurface/5 h-1'}`}
                                    style={{ height: stat.minutes > 0 ? `${(stat.minutes / maxMins) * 100}%` : '4px' }}
                                 ></div>
                                 {stat.minutes > 0 && (
                                     <div className="absolute -top-10 bg-surfaceContainerHigh text-onSurface text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border border-white/5">
                                         {stat.minutes}m<br/><span className="opacity-60">{stat.sessions} sess</span>
                                     </div>
                                 )}
                             </div>
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${idx === 6 ? 'text-primary' : 'text-onSurface/40'}`}>
                                 {stat.name}
                             </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insight Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Lightbulb size={64} /></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-full">
                        <Lightbulb size={20} className="text-yellow-300" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest opacity-80">Insight</span>
                </div>
                <p className="text-lg font-medium leading-snug relative z-10">
                    {getSuggestion()}
                </p>
            </div>
        </div>
      )}

      {/* Task Selector Modal */}
      {showTaskSelector && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setShowTaskSelector(false)}
        >
            <div 
                className="bg-surface w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 animate-in slide-in-from-bottom-10 max-h-[70vh] overflow-y-auto no-scrollbar shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-onSurface">Select Task</h3>
                    <button onClick={() => setShowTaskSelector(false)} className="p-2 hover:bg-surfaceContainer rounded-full"><X size={24} /></button>
                </div>
                
                <div className="space-y-2">
                    {availableTasks.length === 0 ? (
                        <p className="text-center text-onSurface/40 py-8">No active tasks found.</p>
                    ) : (
                        availableTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => { setSelectedTaskId(task.id); setShowTaskSelector(false); vibrate(HapticPatterns.light); }}
                                className={`w-full p-4 rounded-2xl text-left transition-all ${selectedTaskId === task.id ? 'bg-primaryContainer text-onPrimaryContainer border-2 border-primary' : 'bg-surfaceContainer text-onSurface hover:bg-surfaceContainer/80'}`}
                            >
                                <p className="font-medium truncate">{task.text}</p>
                                {task.timeSpent && task.timeSpent > 0 && (
                                    <div className="flex items-center gap-1 mt-1 text-xs opacity-60">
                                        <Timer size={12} />
                                        <span>{task.timeSpent} min spent</span>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

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
