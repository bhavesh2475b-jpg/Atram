
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, TaskTag, PomodoroStat } from '../types';
import { Plus, Trash2, Check, X, ArrowUpDown, Flag, Tag as TagIcon, BarChart2, List, Clock, CheckCircle2, TrendingUp, Timer } from 'lucide-react';
import { vibrate, HapticPatterns } from '../utils/haptics';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [pomoStats, setPomoStats] = useState<PomodoroStat[]>([]);
  
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskTag, setNewTaskTag] = useState<TaskTag>(TaskTag.OTHER);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Swipe state
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Load stats when entering stats view
  useEffect(() => {
      if (viewMode === 'stats') {
          const saved = localStorage.getItem('pomodoro_stats');
          setPomoStats(saved ? JSON.parse(saved) : []);
      }
  }, [viewMode]);

  // Reload tasks when entering list view to ensure timeSpent is up to date from PomodoroView
  useEffect(() => {
    if (viewMode === 'list') {
        const saved = localStorage.getItem('tasks');
        if (saved) setTasks(JSON.parse(saved));
    }
  }, [viewMode]);

  const addTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      tag: newTaskTag,
      createdAt: Date.now(),
      timeSpent: 0,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    setNewTaskPriority(Priority.MEDIUM);
    vibrate(HapticPatterns.success);
    inputRef.current?.focus();
  };

  const toggleTask = (id: string) => {
    vibrate(HapticPatterns.light);
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    vibrate(HapticPatterns.medium);
    setTasks(tasks.filter(t => t.id !== id));
    setSwipeId(null);
    setSwipeOffset(0);
  };

  const toggleSort = () => {
    vibrate(HapticPatterns.light);
    setSortBy(prev => prev === 'date' ? 'priority' : 'date');
  };

  const toggleView = () => {
      vibrate(HapticPatterns.light);
      setViewMode(prev => prev === 'list' ? 'stats' : 'list');
  };

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
      startX.current = e.touches[0].clientX;
      setSwipeId(id);
      setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!swipeId) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - startX.current;
      if (diff < 0) { // Only swipe left
          setSwipeOffset(diff);
      }
  };

  const handleTouchEnd = () => {
      if (swipeOffset < -100 && swipeId) {
          deleteTask(swipeId);
      } else {
          setSwipeOffset(0);
          setSwipeId(null);
      }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (sortBy === 'priority') {
        const pWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        const pA = pWeight[a.priority || Priority.LOW];
        const pB = pWeight[b.priority || Priority.LOW];
        if (pA !== pB) return pB - pA;
      }
      return b.createdAt - a.createdAt;
    });
  }, [tasks, sortBy]);

  // Stats Calculations
  const weeklyStats = useMemo(() => {
      const days = [];
      const today = new Date();
      // Last 7 days including today
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const stat = pomoStats.find(s => s.date === dateStr);
          days.push({ day: dayName, minutes: stat ? stat.minutes : 0, date: dateStr });
      }
      return days;
  }, [pomoStats]);

  const maxMinutes = Math.max(...weeklyStats.map(d => d.minutes), 60);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFocus = pomoStats.find(s => s.date === todayStr)?.minutes || 0;
  const totalTasksCompleted = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((totalTasksCompleted / tasks.length) * 100) : 0;
  const activeCount = tasks.filter(t => !t.completed).length;

  const priorityConfig = {
    [Priority.HIGH]: { color: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', ring: 'ring-rose-500', label: 'High' },
    [Priority.MEDIUM]: { color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', ring: 'ring-amber-500', label: 'Medium' },
    [Priority.LOW]: { color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', label: 'Low' },
  };

  return (
    <div className="h-full w-full max-w-2xl mx-auto p-6 flex flex-col relative animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-4xl font-medium text-onSurface animate-in slide-in-from-left-2 duration-300 key={viewMode}">
              {viewMode === 'list' ? 'Tasks' : 'Insights'}
          </h2>
          {viewMode === 'list' && (
             <p className="text-onSurface/60 text-sm font-medium mt-1 animate-in fade-in">
               {activeCount} pending
             </p>
          )}
        </div>
        <div className="flex gap-3">
            {viewMode === 'list' && (
                <button 
                onClick={toggleSort}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${sortBy === 'priority' ? 'bg-primaryContainer text-onPrimaryContainer' : 'bg-surfaceContainer text-onSurface/60 hover:bg-surfaceContainer/80'}`}
                >
                <ArrowUpDown size={16} />
                <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">{sortBy === 'priority' ? 'Priority' : 'Recent'}</span>
                </button>
            )}
            <button 
                onClick={toggleView}
                className="w-10 h-10 rounded-full bg-surfaceContainer text-onSurface flex items-center justify-center hover:bg-primaryContainer hover:text-onPrimaryContainer transition-colors"
            >
                {viewMode === 'list' ? <BarChart2 size={20} /> : <List size={20} />}
            </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        /* --- LIST VIEW --- */
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-2 overflow-x-hidden">
            {sortedTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-onSurface/30">
                    <CheckCircle2 size={64} className="mb-4 opacity-50" />
                    <p>No tasks yet</p>
                </div>
            )}
            {sortedTasks.map(task => {
            const priority = task.priority || Priority.LOW;
            const pStyle = priorityConfig[priority];
            const isSwiping = swipeId === task.id;
            
            return (
                <div key={task.id} className="relative">
                    {/* Swipe Background Action */}
                    <div className="absolute inset-0 bg-error rounded-[1.5rem] flex items-center justify-end px-6 mb-2">
                        <Trash2 className="text-onError" />
                    </div>

                    <div
                        onTouchStart={(e) => handleTouchStart(e, task.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)' }}
                        className={`relative z-10 flex items-center gap-4 p-4 rounded-[1.5rem] transition-transform duration-200 ease-out border-l-[6px] mb-2 ${
                            task.completed 
                            ? 'bg-surfaceContainer/20 opacity-60 border-transparent' 
                            : `bg-surfaceContainer ${pStyle.border}`
                        }`}
                    >
                    <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-[2.5px] flex items-center justify-center transition-all duration-200 shrink-0 ${
                        task.completed
                            ? 'bg-primary border-primary text-onPrimary'
                            : `border-onSurface/20 text-transparent hover:border-primary hover:scale-110`
                        }`}
                    >
                        <Check size={14} strokeWidth={4} />
                    </button>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-lg font-medium truncate transition-all duration-200 ${
                            task.completed ? 'text-onSurface/40 line-through' : 'text-onSurface'
                        }`}>
                            {task.text}
                        </p>
                        </div>
                        {!task.completed && (
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${pStyle.color}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${pStyle.text} opacity-80`}>{pStyle.label}</span>
                                </div>
                                {task.tag && (
                                    <span className="text-[10px] font-medium text-onSurface/40 px-1.5 py-0.5 rounded-md bg-onSurface/5">
                                        {task.tag}
                                    </span>
                                )}
                                {task.timeSpent && task.timeSpent > 0 ? (
                                    <div className="flex items-center gap-1 text-primary bg-primary/5 px-1.5 py-0.5 rounded-md">
                                        <Timer size={10} />
                                        <span className="text-[10px] font-bold">{task.timeSpent} min</span>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-full text-onSurface/20 hover:text-error hover:bg-error/10 transition-all duration-200 opacity-0 group-hover:opacity-100 hidden sm:block"
                    >
                        <Trash2 size={18} />
                    </button>
                    </div>
                </div>
            );
            })}
        </div>
      ) : (
        /* --- STATS VIEW --- */
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Weekly Focus Chart */}
            <div className="bg-surfaceContainer rounded-[2.5rem] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 text-onSurface/70">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                         <BarChart2 size={20} />
                    </div>
                    <span className="font-medium text-lg">Weekly Focus</span>
                </div>
                
                <div className="flex justify-between items-end h-48 gap-2 px-2">
                    {weeklyStats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                             <div className="relative w-full flex items-end justify-center h-full">
                                 <div 
                                    className={`w-full rounded-t-xl transition-all duration-700 ease-out ${stat.minutes > 0 ? 'bg-primary opacity-90 group-hover:opacity-100' : 'bg-onSurface/5 h-1'}`}
                                    style={{ height: stat.minutes > 0 ? `${(stat.minutes / maxMinutes) * 100}%` : '4px' }}
                                 ></div>
                                 {stat.minutes > 0 && (
                                     <div className="absolute -top-8 bg-surface text-onSurface text-xs font-bold px-2 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                         {stat.minutes}m
                                     </div>
                                 )}
                             </div>
                             <span className={`text-xs font-medium ${stat.date === todayStr ? 'text-primary font-bold' : 'text-onSurface/40'}`}>
                                 {stat.day}
                             </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Today's Focus */}
                <div className="bg-surfaceContainer rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <div className="p-2 bg-blue-500/10 w-fit rounded-xl text-blue-500 mb-2">
                         <Clock size={24} />
                     </div>
                     <div>
                         <span className="text-5xl font-bold text-onSurface tracking-tighter">{todayFocus}</span>
                         <span className="text-sm text-onSurface/50 font-medium ml-1">min</span>
                         <p className="text-onSurface/60 text-sm font-medium mt-2">Focus Today</p>
                     </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-surfaceContainer rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square relative overflow-hidden">
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
                     <div className="p-2 bg-emerald-500/10 w-fit rounded-xl text-emerald-500 mb-2">
                         <TrendingUp size={24} />
                     </div>
                     <div>
                         <span className="text-5xl font-bold text-onSurface tracking-tighter">{completionRate}</span>
                         <span className="text-sm text-onSurface/50 font-medium ml-1">%</span>
                         <p className="text-onSurface/60 text-sm font-medium mt-2">Task Completion</p>
                     </div>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-surfaceContainer/50 rounded-[2rem] p-6 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primaryContainer flex items-center justify-center text-onPrimaryContainer shrink-0">
                     <CheckCircle2 size={24} />
                 </div>
                 <div>
                     <p className="text-onSurface font-medium text-lg">{totalTasksCompleted} Tasks Completed</p>
                     <p className="text-onSurface/50 text-sm">Keep up the momentum!</p>
                 </div>
            </div>
        </div>
      )}

      {/* Add Task Modal (Only in List View) */}
      {viewMode === 'list' && (
        showInput ? (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setShowInput(false); }}
            >
            <form 
                onSubmit={addTask}
                className="bg-surface w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-medium text-onSurface">New Task</h3>
                    <button type="button" onClick={() => setShowInput(false)} className="p-2 rounded-full hover:bg-surfaceContainer text-onSurface/60">
                        <X size={24} />
                    </button>
                </div>
                
                <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="What needs to be done?"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full bg-surfaceContainer text-onSurface text-xl p-5 rounded-2xl placeholder:text-onSurface/30 focus:outline-none focus:ring-2 focus:ring-primary mb-6 transition-all duration-200"
                />
                
                <div className="space-y-4 mb-8">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {Object.values(Priority).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => { setNewTaskPriority(p); vibrate(HapticPatterns.light); }}
                                className={`flex-1 min-w-[80px] py-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 ${
                                    newTaskPriority === p 
                                    ? `${priorityConfig[p].color} ${priorityConfig[p].ring} border-transparent text-surface` 
                                    : 'border-surfaceContainer bg-transparent text-onSurface/50 hover:bg-surfaceContainer/50'
                                }`}
                            >   
                                <Flag size={16} fill={newTaskPriority === p ? "currentColor" : "none"} />
                                <span className="text-xs font-bold uppercase">{priorityConfig[p].label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {Object.values(TaskTag).map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => { setNewTaskTag(tag); vibrate(HapticPatterns.light); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    newTaskTag === tag 
                                    ? 'bg-primaryContainer text-onPrimaryContainer ring-1 ring-primary' 
                                    : 'bg-surfaceContainer text-onSurface/60'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
                
                <button 
                type="submit"
                disabled={!newTaskText.trim()}
                className="w-full py-4 rounded-2xl bg-primary text-onPrimary font-bold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
                >
                Add Task
                </button>
            </form>
            </div>
        ) : (
            <button 
            onClick={() => { setShowInput(true); vibrate(HapticPatterns.light); }}
            className="fixed bottom-24 right-6 sm:right-auto sm:left-1/2 sm:-ml-10 w-20 h-20 rounded-[2rem] bg-primaryContainer text-onPrimaryContainer shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-40 group"
            >
            <Plus size={36} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>
        )
      )}
    </div>
  );
};
