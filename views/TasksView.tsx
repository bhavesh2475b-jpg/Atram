
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority } from '../types';
import { Plus, Trash2, Check, X, ArrowUpDown, Flag } from 'lucide-react';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    setNewTaskPriority(Priority.MEDIUM); // Reset to default
    inputRef.current?.focus();
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleSort = () => {
    setSortBy(prev => prev === 'date' ? 'priority' : 'date');
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Always move completed to bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      if (sortBy === 'priority') {
        const pWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        // Handle potential undefined priority from old data
        const pA = pWeight[a.priority || Priority.LOW];
        const pB = pWeight[b.priority || Priority.LOW];
        if (pA !== pB) return pB - pA; // Higher weight first
      }

      // Default/Secondary sort by date (newest first)
      return b.createdAt - a.createdAt;
    });
  }, [tasks, sortBy]);

  const activeCount = tasks.filter(t => !t.completed).length;

  const priorityConfig = {
    [Priority.HIGH]: { color: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', ring: 'ring-rose-500', label: 'High' },
    [Priority.MEDIUM]: { color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', ring: 'ring-amber-500', label: 'Medium' },
    [Priority.LOW]: { color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', label: 'Low' },
  };

  return (
    <div className="h-full w-full max-w-2xl mx-auto p-6 flex flex-col relative animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-4xl font-medium text-onSurface">Tasks</h2>
          <p className="text-onSurface/60 text-sm font-medium mt-1">
            {activeCount} pending
          </p>
        </div>
        <button 
          onClick={toggleSort}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${sortBy === 'priority' ? 'bg-primaryContainer text-onPrimaryContainer' : 'bg-surfaceContainer text-onSurface/60 hover:bg-surfaceContainer/80'}`}
        >
          <ArrowUpDown size={16} />
          <span className="text-xs font-bold uppercase tracking-wide">{sortBy === 'priority' ? 'Priority' : 'Recent'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-2">
        {sortedTasks.map(task => {
           const priority = task.priority || Priority.LOW; // Fallback for legacy data
           const pStyle = priorityConfig[priority];

           return (
            <div
              key={task.id}
              className={`group flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-200 ease-out border-l-[6px] ${
                task.completed 
                  ? 'bg-surfaceContainer/20 opacity-60 border-transparent' 
                  : `bg-surfaceContainer ${pStyle.border}`
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-[2.5px] flex items-center justify-center transition-all duration-200 ${
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
                   <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${pStyle.color}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${pStyle.text} opacity-80`}>{pStyle.label}</span>
                   </div>
                )}
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 rounded-full text-onSurface/20 hover:text-error hover:bg-error/10 transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-onSurface/30">
            <div className="w-16 h-16 rounded-[2rem] bg-surfaceContainer flex items-center justify-center mb-4">
                <Check size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">Tap + to add a new task</p>
          </div>
        )}
      </div>

      {/* Add Task Modal/Overlay */}
      {showInput ? (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) setShowInput(false);
            }}
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
             
             <div className="flex gap-2 mb-6">
                {Object.values(Priority).map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setNewTaskPriority(p)}
                        className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 ${
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
          onClick={() => setShowInput(true)}
          className="fixed bottom-24 right-6 sm:right-auto sm:left-1/2 sm:-ml-10 w-20 h-20 rounded-[2rem] bg-primaryContainer text-onPrimaryContainer shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-40 group"
        >
          <Plus size={36} className="group-hover:rotate-90 transition-transform duration-200" />
        </button>
      )}
    </div>
  );
};
