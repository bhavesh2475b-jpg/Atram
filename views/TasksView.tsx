
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, TaskTag, PomodoroStat } from '../types';
import { Plus, Trash2, Check, X, ArrowUpDown, Flag, Tag as TagIcon, BarChart2, List, Clock, CheckCircle2, TrendingUp, Timer, Edit2 } from 'lucide-react';
import { vibrate, HapticPatterns } from '../utils/haptics';

interface TasksViewProps {
    onEditModeChange?: (isHidden: boolean) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onEditModeChange }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [pomoStats, setPomoStats] = useState<PomodoroStat[]>([]);
  
  // Edit/New State
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // Notify parent about input mode to toggle Nav visibility
  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(showInput);
    }
  }, [showInput, onEditModeChange]);

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

  // Reload tasks when entering list view to ensure timeSpent is up to date
  useEffect(() => {
    if (viewMode === 'list') {
        const saved = localStorage.getItem('tasks');
        if (saved) setTasks(JSON.parse(saved));
    }
  }, [viewMode]);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;

    if (editingId) {
        // Update existing task
        setTasks(tasks.map(t => t.id === editingId ? {
            ...t,
            text: newTaskText.trim(),
            priority: newTaskPriority,
            tag: newTaskTag
        } : t));
        setEditingId(null);
        setShowInput(false);
    } else {
        // Create new task
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
        inputRef.current?.focus();
    }

    setNewTaskText('');
    setNewTaskPriority(Priority.MEDIUM);
    setNewTaskTag(TaskTag.OTHER);
    vibrate(HapticPatterns.success);
  };

  const openNewTask = () => {
      setEditingId(null);
      setNewTaskText('');
      setNewTaskPriority(Priority.MEDIUM);
      setNewTaskTag(TaskTag.OTHER);
      setShowInput(true);
  };

  const openEditTask = (task: Task) => {
      setEditingId(task.id);
      setNewTaskText(task.text);
      setNewTaskPriority(task.priority);
      setNewTaskTag(task.tag);
      setShowInput(true);
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
      if (diff < 0) { 
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

  // Stats Calculations (Same as before)
  const weeklyStats = useMemo(() => {
      const days = [];
      const today = new Date();
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
    [Priority.HIGH]: { color: 'bg-rose-500', text: 'text-rose-500', border: 'border-l-rose-500', ring: 'ring-rose-500', label: 'High', bg: 'bg-rose-500/10' },
    [Priority.MEDIUM]: { color: 'bg-amber-500', text: 'text-amber-500', border: 'border-l-amber-500', ring: 'ring-amber-500', label: 'Medium', bg: 'bg-amber-500/10' },
    [Priority.LOW]: { color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-l-emerald-500', ring: 'ring-emerald-500', label: 'Low', bg: 'bg-emerald-500/10' },
  };

  return (
    <div className="h-full w-full max-w-2xl mx-auto p-6 flex flex-col relative animate-in fade-in duration-500 ease-expressive">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-5xl font-medium text-onSurface tracking-tight animate-in slide-in-from-left-2 duration-300 key={viewMode}">
              {viewMode === 'list' ? 'Tasks' : 'Insights'}
          </h2>
          {viewMode === 'list' && (
             <p className="text-onSurface/60 text-lg font-normal mt-1">
               {activeCount} pending
             </p>
          )}
        </div>
        <div className="flex gap-3">
            {viewMode === 'list' && (
                <button 
                onClick={toggleSort}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 ${sortBy === 'priority' ? 'bg-secondaryContainer text-onSecondaryContainer' : 'bg-surfaceContainer text-onSurface/60 hover:bg-surfaceContainerHigh'}`}
                >
                <ArrowUpDown size={20} />
                </button>
            )}
            <button 
                onClick={toggleView}
                className="w-14 h-14 rounded-[1.2rem] bg-surfaceContainer text-onSurface flex items-center justify-center hover:bg-primaryContainer hover:text-onPrimaryContainer transition-all"
            >
                {viewMode === 'list' ? <BarChart2 size={24} /> : <List size={24} />}
            </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        /* --- LIST VIEW --- */
        <div className="flex-1 overflow-y-auto no-scrollbar pb-48 space-y-3 overflow-x-hidden">
            {sortedTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-onSurface/30">
                    <CheckCircle2 size={80} className="mb-4 opacity-30" strokeWidth={1} />
                    <p className="text-xl">No active tasks</p>
                </div>
            )}
            {sortedTasks.map(task => {
            const priority = task.priority || Priority.LOW;
            const pStyle = priorityConfig[priority];
            const isSwiping = swipeId === task.id;
            
            return (
                <div key={task.id} className="relative group">
                    {/* Swipe Background Action */}
                    <div className="absolute inset-0 bg-error rounded-[2rem] flex items-center justify-end px-8 mb-3">
                        <Trash2 className="text-onError" size={24} />
                    </div>

                    <div
                        onTouchStart={(e) => handleTouchStart(e, task.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)' }}
                        className={`relative z-10 flex items-center gap-5 p-6 rounded-[2rem] transition-all duration-500 ease-spring mb-3 cursor-pointer active:scale-[0.98] ${
                            task.completed 
                            ? 'bg-surfaceContainer/30 opacity-50' 
                            : `bg-surfaceContainer hover:bg-surfaceContainerHigh`
                        }`}
                    >
                    <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-300 shrink-0 ${
                        task.completed
                            ? 'bg-primary border-primary text-onPrimary scale-110'
                            : `border-onSurface/30 text-transparent hover:border-primary hover:scale-110`
                        }`}
                    >
                        <Check size={16} strokeWidth={4} />
                    </button>
                    
                    <div 
                        className="flex-1 min-w-0 flex flex-col"
                        onClick={() => openEditTask(task)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xl font-medium truncate transition-all duration-300 ${
                            task.completed ? 'text-onSurface/40 line-through' : 'text-onSurface'
                        }`}>
                            {task.text}
                        </p>
                        </div>
                        {!task.completed && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${pStyle.bg} ${pStyle.text}`}>
                                    {pStyle.label}
                                </span>
                                {task.tag && (
                                    <span className="text-[10px] font-bold text-onSurface/50 px-2 py-1 rounded-md bg-onSurface/5">
                                        {task.tag}
                                    </span>
                                )}
                                {task.timeSpent && task.timeSpent > 0 ? (
                                    <div className="flex items-center gap-1 text-primary bg-primary/5 px-2 py-1 rounded-md">
                                        <Timer size={12} />
                                        <span className="text-[10px] font-bold">{task.timeSpent}m</span>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            );
            })}
        </div>
      ) : (
        /* --- STATS VIEW --- */
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            
            {/* Weekly Focus Chart */}
            <div className="bg-surfaceContainer rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 text-onSurface/70">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                         <BarChart2 size={24} />
                    </div>
                    <span className="font-medium text-xl text-onSurface">Weekly Activity</span>
                </div>
                
                <div className="flex justify-between items-end h-56 gap-3 px-2">
                    {weeklyStats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3 flex-1 group">
                             <div className="relative w-full flex items-end justify-center h-full">
                                 <div 
                                    className={`w-full rounded-t-2xl transition-all duration-1000 ease-spring ${stat.minutes > 0 ? 'bg-primary opacity-90 group-hover:opacity-100' : 'bg-onSurface/5 h-2 rounded-full'}`}
                                    style={{ height: stat.minutes > 0 ? `${(stat.minutes / maxMinutes) * 100}%` : '8px' }}
                                 ></div>
                             </div>
                             <span className={`text-xs font-bold uppercase tracking-wider ${stat.date === todayStr ? 'text-primary' : 'text-onSurface/40'}`}>
                                 {stat.day.charAt(0)}
                             </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Today's Focus */}
                <div className="bg-surfaceContainer rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square relative overflow-hidden group hover:bg-surfaceContainerHigh transition-colors">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors"></div>
                     <div className="p-3 bg-blue-500/10 w-fit rounded-2xl text-blue-500 mb-2">
                         <Clock size={28} />
                     </div>
                     <div>
                         <span className="text-6xl font-bold text-onSurface tracking-tighter">{todayFocus}</span>
                         <p className="text-onSurface/60 text-sm font-bold uppercase tracking-wider mt-2">Mins Today</p>
                     </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-surfaceContainer rounded-[2.5rem] p-6 flex flex-col justify-between aspect-square relative overflow-hidden group hover:bg-surfaceContainerHigh transition-colors">
                     <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                     <div className="p-3 bg-emerald-500/10 w-fit rounded-2xl text-emerald-500 mb-2">
                         <TrendingUp size={28} />
                     </div>
                     <div>
                         <span className="text-6xl font-bold text-onSurface tracking-tighter">{completionRate}<span className="text-3xl text-onSurface/40">%</span></span>
                         <p className="text-onSurface/60 text-sm font-bold uppercase tracking-wider mt-2">Completion</p>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Task Modal (Only in List View) */}
      {viewMode === 'list' && (
        showInput ? (
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center sm:p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setShowInput(false); }}
            >
            <form 
                onSubmit={handleSave}
                className="bg-surface w-full max-w-lg sm:rounded-[3rem] rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-32 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-medium text-onSurface">{editingId ? 'Edit Task' : 'New Task'}</h3>
                    <button type="button" onClick={() => setShowInput(false)} className="p-3 rounded-full bg-surfaceContainer hover:bg-surfaceContainerHigh text-onSurface">
                        <X size={24} />
                    </button>
                </div>
                
                <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="What needs doing?"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full bg-surfaceContainer text-onSurface text-2xl font-medium p-6 rounded-[2rem] placeholder:text-onSurface/20 focus:outline-none focus:ring-4 focus:ring-primary/20 mb-8 transition-all"
                />
                
                <div className="space-y-6 mb-10">
                    <label className="text-xs font-bold uppercase tracking-widest text-onSurface/40 ml-2">Priority</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {Object.values(Priority).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => { setNewTaskPriority(p); vibrate(HapticPatterns.light); }}
                                className={`flex-1 min-w-[90px] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                                    newTaskPriority === p 
                                    ? `${priorityConfig[p].bg} ${priorityConfig[p].text} ring-2 ring-inset ${priorityConfig[p].ring}` 
                                    : 'bg-surfaceContainer text-onSurface/40'
                                }`}
                            >   
                                <Flag size={20} fill={newTaskPriority === p ? "currentColor" : "none"} />
                                <span className="text-xs font-bold uppercase">{priorityConfig[p].label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <label className="text-xs font-bold uppercase tracking-widest text-onSurface/40 ml-2 mt-4 block">Category</label>
                    <div className="flex gap-2 flex-wrap">
                        {Object.values(TaskTag).map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => { setNewTaskTag(tag); vibrate(HapticPatterns.light); }}
                                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                                    newTaskTag === tag 
                                    ? 'bg-primaryContainer text-onPrimaryContainer scale-105' 
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
                className="w-full py-6 rounded-[2.5rem] bg-primary text-onPrimary text-xl font-bold shadow-xl disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] mb-safe"
                >
                {editingId ? 'Save Changes' : 'Create Task'}
                </button>
            </form>
            </div>
        ) : (
            <button 
            onClick={() => { openNewTask(); vibrate(HapticPatterns.light); }}
            className="fixed bottom-32 right-6 sm:right-auto sm:left-1/2 sm:-ml-10 w-20 h-20 rounded-[2.2rem] bg-primaryContainer text-onPrimaryContainer shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-300 z-40 group"
            >
            <Plus size={40} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
        )
      )}
    </div>
  );
};
