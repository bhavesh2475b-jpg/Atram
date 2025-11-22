
import React, { useState, useEffect, useRef } from 'react';
import { Alarm, SOUND_OPTIONS } from '../types';
import { Plus, Trash2, BellOff, Music, Calendar as CalendarIcon, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';
import { playSound } from '../utils/sound';

export const AlarmView: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: '1', time: '07:00', label: 'Morning Routine', enabled: true, days: [1, 2, 3, 4, 5], soundId: 'chime' },
    { id: '2', time: '08:30', label: 'Standup Meeting', enabled: false, days: [1, 2, 3, 4, 5], soundId: 'digital' }
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New/Edit Alarm State
  const [newTime, setNewTime] = useState('09:00');
  const [newLabel, setNewLabel] = useState('');
  
  // Schedule State
  const [scheduleMode, setScheduleMode] = useState<'weekly' | 'date'>('weekly');
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default to daily
  const [specificDate, setSpecificDate] = useState<string | undefined>(undefined); // YYYY-MM-DD
  
  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());

  // Sound State
  const [selectedSound, setSelectedSound] = useState('digital');
  const [customSound, setCustomSound] = useState<{name: string, url: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alarm checking logic
  useEffect(() => {
    const checkAlarms = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentSecond = now.getSeconds();
        const currentDay = now.getDay(); // 0 = Sunday
        
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;
        
        if (currentSecond === 0) {
            alarms.forEach(alarm => {
                if (!alarm.enabled) return;
                if (alarm.time !== currentTime) return;

                let shouldRing = false;

                if (alarm.specificDate) {
                    if (alarm.specificDate === todayStr) {
                        shouldRing = true;
                    }
                } else if (alarm.days.length > 0) {
                    if (alarm.days.includes(currentDay)) {
                        shouldRing = true;
                    }
                } else {
                    // "Once" alarm (no days, no date) - implies next occurrence
                    shouldRing = true;
                }

                if (shouldRing) {
                    playSound(alarm.soundId, alarm.customSoundUrl);
                    alert(`Alarm: ${alarm.label || 'Untitled'}`);
                    
                    // If it was a specific date alarm, disable it
                    if (alarm.specificDate) {
                        setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, enabled: false } : a));
                    }
                }
            });
        }
    }, 1000);
    return () => clearInterval(checkAlarms);
  }, [alarms]);

  const toggleAlarm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const openEditModal = (alarm: Alarm) => {
    setEditingId(alarm.id);
    setNewTime(alarm.time);
    setNewLabel(alarm.label);
    setSelectedSound(alarm.soundId);
    
    if (alarm.customSoundUrl && alarm.customSoundName) {
        setCustomSound({ name: alarm.customSoundName, url: alarm.customSoundUrl });
    } else {
        setCustomSound(null);
    }

    if (alarm.specificDate) {
        setScheduleMode('date');
        setSpecificDate(alarm.specificDate);
        // Ensure calendar view is close to specific date
        setViewDate(new Date(alarm.specificDate));
    } else {
        setScheduleMode('weekly');
        setNewDays(alarm.days);
    }
    setShowAdd(true);
  };

  const openNewModal = () => {
      setEditingId(null);
      setNewTime('09:00');
      setNewLabel('');
      setNewDays([0, 1, 2, 3, 4, 5, 6]);
      setSpecificDate(undefined);
      setScheduleMode('weekly');
      setSelectedSound('digital');
      setCustomSound(null);
      setShowAdd(true);
  };

  const toggleDay = (dayIndex: number) => {
    if (newDays.includes(dayIndex)) {
        setNewDays(newDays.filter(d => d !== dayIndex).sort());
    } else {
        setNewDays([...newDays, dayIndex].sort());
    }
  };

  const setDaysRange = (type: 'weekdays' | 'weekends' | 'daily') => {
      if (type === 'weekdays') setNewDays([1, 2, 3, 4, 5]);
      if (type === 'weekends') setNewDays([0, 6]);
      if (type === 'daily') setNewDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const getRepeatLabel = (alarm: Alarm) => {
    if (alarm.specificDate) {
        const date = new Date(alarm.specificDate + 'T00:00:00');
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    const days = alarm.days;
    if (days.length === 7) return 'Daily';
    if (days.length === 0) return 'Once';
    if (days.length === 5 && days.every(d => [1,2,3,4,5].includes(d))) return 'Weekdays';
    if (days.length === 2 && days.every(d => [0,6].includes(d))) return 'Weekends';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { // Limit to ~2MB
        alert("File too large. Please select a sound under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setCustomSound({ name: file.name.split('.')[0], url });
          setSelectedSound('custom');
          playSound('custom', url); // Preview
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAlarm = () => {
      const alarmData: Alarm = {
          id: editingId || Date.now().toString(),
          time: newTime,
          label: newLabel || 'Alarm',
          enabled: true,
          days: scheduleMode === 'weekly' ? newDays : [],
          specificDate: scheduleMode === 'date' ? specificDate : undefined,
          soundId: selectedSound,
          customSoundName: selectedSound === 'custom' ? customSound?.name : undefined,
          customSoundUrl: selectedSound === 'custom' ? customSound?.url : undefined
      };

      if (editingId) {
          setAlarms(alarms.map(a => a.id === editingId ? alarmData : a));
      } else {
          setAlarms([...alarms, alarmData]);
      }
      setShowAdd(false);
  };

  // Calendar Helpers
  const getCalendarDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const changeMonth = (delta: number) => {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setViewDate(newDate);
  };

  const handleDateClick = (day: number) => {
      const y = viewDate.getFullYear();
      const m = String(viewDate.getMonth() + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      setSpecificDate(`${y}-${m}-${d}`);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="h-full w-full max-w-2xl mx-auto p-6 flex flex-col relative animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-4xl font-medium text-onSurface">Alarms</h2>
        <span className="text-onSurface/50 text-sm font-medium bg-surfaceContainer px-3 py-1 rounded-full">{alarms.filter(a => a.enabled).length} Active</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-4">
        {alarms.map(alarm => (
            <div 
                key={alarm.id} 
                onClick={() => openEditModal(alarm)}
                className={`group relative overflow-hidden rounded-[2rem] p-6 transition-all duration-500 ease-out hover:shadow-lg cursor-pointer active:scale-[0.98] ${alarm.enabled ? 'bg-surfaceContainer' : 'bg-surfaceContainer/30'}`}
            >
                <div className="flex justify-between items-center z-10 relative">
                    <div className="flex flex-col">
                        <span className={`text-6xl font-sans font-medium tracking-tight transition-colors ${alarm.enabled ? 'text-onSurface' : 'text-onSurface/40'}`}>
                            {alarm.time}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <span className="text-onSurface font-medium text-base">{alarm.label}</span>
                          <div className="flex items-center gap-1 text-onSurface/60 text-sm">
                             {alarm.soundId !== 'digital' && <Music size={14} className="text-primary" />}
                             <span>•</span>
                             <span className={alarm.specificDate ? 'text-primary font-bold' : ''}>{getRepeatLabel(alarm)}</span>
                          </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => toggleAlarm(e, alarm.id)}
                        className={`w-20 h-10 rounded-full relative transition-colors duration-300 shrink-0 ${alarm.enabled ? 'bg-primary' : 'bg-onSurface/10'}`}
                    >
                        <div className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow-md transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${alarm.enabled ? 'left-11' : 'left-1'}`} />
                    </button>
                </div>
                
                <button 
                    onClick={(e) => deleteAlarm(e, alarm.id)}
                    className="absolute top-4 right-4 p-3 rounded-full text-onSurface/20 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        ))}

        {alarms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-onSurface/30 animate-pulse">
                <BellOff size={64} className="mb-6 opacity-50" />
                <p className="text-lg font-medium">No alarms yet</p>
                <p className="text-sm">Tap + to add one</p>
            </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={openNewModal}
        className="fixed bottom-24 right-6 sm:right-auto sm:left-1/2 sm:-ml-10 w-20 h-20 rounded-[2rem] bg-primaryContainer text-onPrimaryContainer shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40 group"
      >
        <Plus size={36} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Add/Edit Alarm Modal */}
      {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
              <div className="bg-surface w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 sm:p-8 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                  <h3 className="text-3xl text-onSurface font-medium mb-6">{editingId ? 'Edit Alarm' : 'New Alarm'}</h3>
                  
                  <div className="space-y-6">
                      {/* Time Input */}
                      <div className="bg-surfaceContainer/50 rounded-3xl p-4">
                          <input 
                            type="time" 
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full bg-transparent text-center text-onSurface text-6xl font-bold p-2 focus:outline-none"
                          />
                      </div>

                      {/* Label Input */}
                      <input 
                        type="text" 
                        placeholder="Label (e.g., Work)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full bg-surfaceContainer text-onSurface p-4 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />

                      {/* Schedule Mode Tabs */}
                      <div className="bg-surfaceContainer p-1 rounded-[1.5rem] flex">
                          <button 
                            onClick={() => setScheduleMode('weekly')}
                            className={`flex-1 py-3 rounded-[1.2rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${scheduleMode === 'weekly' ? 'bg-primary text-onPrimary shadow-md' : 'text-onSurface/60 hover:text-onSurface'}`}
                          >
                            <Repeat size={16} /> Weekly
                          </button>
                          <button 
                             onClick={() => setScheduleMode('date')}
                             className={`flex-1 py-3 rounded-[1.2rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${scheduleMode === 'date' ? 'bg-primary text-onPrimary shadow-md' : 'text-onSurface/60 hover:text-onSurface'}`}
                          >
                            <CalendarIcon size={16} /> One Time
                          </button>
                      </div>

                      {/* Weekly View */}
                      {scheduleMode === 'weekly' && (
                          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                             <div className="flex justify-between gap-1 mb-3">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                                    <button
                                    key={index}
                                    onClick={() => toggleDay(index)}
                                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center ${
                                        newDays.includes(index) 
                                        ? 'bg-primaryContainer text-onPrimaryContainer ring-2 ring-primary' 
                                        : 'bg-surfaceContainer text-onSurface/50 hover:bg-surfaceContainer/80'
                                    }`}
                                    >
                                    {label}
                                    </button>
                                ))}
                             </div>
                             {/* Range Presets */}
                             <div className="flex gap-2">
                                <button onClick={() => setDaysRange('weekdays')} className="px-3 py-1 rounded-lg bg-surfaceContainer/50 text-xs font-medium text-onSurface hover:bg-surfaceContainer">Weekdays</button>
                                <button onClick={() => setDaysRange('weekends')} className="px-3 py-1 rounded-lg bg-surfaceContainer/50 text-xs font-medium text-onSurface hover:bg-surfaceContainer">Weekends</button>
                                <button onClick={() => setDaysRange('daily')} className="px-3 py-1 rounded-lg bg-surfaceContainer/50 text-xs font-medium text-onSurface hover:bg-surfaceContainer">Daily</button>
                             </div>
                          </div>
                      )}

                      {/* Calendar View */}
                      {scheduleMode === 'date' && (
                          <div className="bg-surfaceContainer rounded-[2rem] p-4 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex justify-between items-center mb-4 px-2">
                                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-onSurface/10 rounded-full"><ChevronLeft size={20} /></button>
                                  <span className="font-bold text-onSurface">
                                      {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                  </span>
                                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-onSurface/10 rounded-full"><ChevronRight size={20} /></button>
                              </div>
                              
                              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs font-bold text-onSurface/40">{d}</span>)}
                              </div>
                              
                              <div className="grid grid-cols-7 gap-1 place-items-center">
                                  {getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()).map((day, i) => {
                                      if (!day) return <div key={i} />;
                                      
                                      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                      const isSelected = specificDate === dateStr;
                                      const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
                                      
                                      return (
                                          <button
                                            key={i}
                                            onClick={() => handleDateClick(day)}
                                            className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-primary text-onPrimary font-bold shadow-md scale-110' : 
                                                isToday ? 'bg-surfaceContainer text-primary font-bold border border-primary' :
                                                'text-onSurface hover:bg-onSurface/10'
                                            }`}
                                          >
                                              {day}
                                          </button>
                                      );
                                  })}
                              </div>
                              <div className="text-center mt-3 min-h-[20px]">
                                  <span className="text-sm text-primary font-medium">
                                      {specificDate ? new Date(specificDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                                  </span>
                              </div>
                          </div>
                      )}

                      {/* Sound Selector (Condensed) */}
                      <div>
                        <label className="text-xs text-onSurface/50 uppercase tracking-wider font-bold ml-1 mb-2 block">Sound</label>
                        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                          {SOUND_OPTIONS.map(sound => (
                            <button
                              key={sound.id}
                              onClick={() => { setSelectedSound(sound.id); playSound(sound.id); }}
                              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm border transition-all ${selectedSound === sound.id ? 'bg-primaryContainer border-primary text-onSurface font-medium' : 'border-surfaceContainer bg-surfaceContainer/50 text-onSurface/70'}`}
                            >
                              {sound.name}
                            </button>
                          ))}
                          <button 
                             onClick={() => fileInputRef.current?.click()}
                             className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm border transition-all ${selectedSound === 'custom' ? 'bg-primaryContainer border-primary text-onSurface font-medium' : 'border-surfaceContainer bg-surfaceContainer/50 text-onSurface/70'}`}
                          >
                              {selectedSound === 'custom' && customSound ? customSound.name : 'Upload...'}
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                        </div>
                      </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                      <button onClick={() => setShowAdd(false)} className="flex-1 py-4 rounded-2xl text-primary font-medium hover:bg-surfaceContainer transition-colors">
                          Cancel
                      </button>
                      <button onClick={saveAlarm} className="flex-1 py-4 rounded-2xl bg-primary text-onPrimary font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                          Save
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
