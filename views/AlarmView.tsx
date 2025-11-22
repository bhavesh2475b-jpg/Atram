import React, { useState, useEffect, useRef } from 'react';
import { Alarm, SOUND_OPTIONS, AppSettings } from '../types';
import { Plus, Trash2, BellOff, Music, Calendar as CalendarIcon, Repeat, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { playSound } from '../utils/sound';
import { vibrate, HapticPatterns } from '../utils/haptics';

interface AlarmViewProps {
    settings: AppSettings;
    onEditModeChange?: (isEditing: boolean) => void;
}

const ALARM_COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

const COLOR_STYLES: Record<string, { bg: string, text: string, indicator: string }> = {
    default: { bg: 'bg-surfaceContainer', text: 'text-onSurface', indicator: 'bg-primary' },
    red: { bg: 'bg-rose-900/40', text: 'text-rose-100', indicator: 'bg-rose-500' },
    orange: { bg: 'bg-orange-900/40', text: 'text-orange-100', indicator: 'bg-orange-500' },
    yellow: { bg: 'bg-amber-900/40', text: 'text-amber-100', indicator: 'bg-amber-500' },
    green: { bg: 'bg-emerald-900/40', text: 'text-emerald-100', indicator: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-900/40', text: 'text-blue-100', indicator: 'bg-blue-500' },
    purple: { bg: 'bg-violet-900/40', text: 'text-violet-100', indicator: 'bg-violet-500' },
    pink: { bg: 'bg-fuchsia-900/40', text: 'text-fuchsia-100', indicator: 'bg-fuchsia-500' },
};

export const AlarmView: React.FC<AlarmViewProps> = ({ settings, onEditModeChange }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: '1', time: '07:00', label: 'Morning Routine', enabled: true, days: [1, 2, 3, 4, 5], soundId: 'chime', color: 'orange' },
    { id: '2', time: '08:30', label: 'Standup Meeting', enabled: false, days: [1, 2, 3, 4, 5], soundId: 'digital', color: 'blue' }
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New/Edit Alarm State
  const [newTime, setNewTime] = useState('09:00');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('default');
  
  // Schedule State
  const [scheduleMode, setScheduleMode] = useState<'weekly' | 'date'>('weekly');
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); 
  const [specificDate, setSpecificDate] = useState<string | undefined>(undefined); 
  
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedSound, setSelectedSound] = useState('digital');
  const [customSound, setCustomSound] = useState<{name: string, url: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swipe State
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);

  // Notify parent about edit mode to toggle Nav visibility
  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(showAdd);
    }
    return () => {
        if (onEditModeChange) onEditModeChange(false);
    };
  }, [showAdd, onEditModeChange]);

  useEffect(() => {
    const checkAlarms = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentSecond = now.getSeconds();
        const currentDay = now.getDay();
        
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
                    shouldRing = true;
                }

                if (shouldRing) {
                    playSound(alarm.soundId, alarm.customSoundUrl);
                    alert(`Alarm: ${alarm.label || 'Untitled'}`); // In production, use notification/modal
                    
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
    vibrate(HapticPatterns.light);
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: string) => {
    vibrate(HapticPatterns.medium);
    setAlarms(alarms.filter(a => a.id !== id));
    setSwipeId(null);
    setSwipeOffset(0);
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
          deleteAlarm(swipeId);
      } else {
          setSwipeOffset(0);
          setSwipeId(null);
      }
  };

  const openEditModal = (alarm: Alarm) => {
    setEditingId(alarm.id);
    setNewTime(alarm.time);
    setNewLabel(alarm.label);
    setSelectedSound(alarm.soundId);
    setNewColor(alarm.color || 'default');
    
    if (alarm.customSoundUrl && alarm.customSoundName) {
        setCustomSound({ name: alarm.customSoundName, url: alarm.customSoundUrl });
    } else {
        setCustomSound(null);
    }

    if (alarm.specificDate) {
        setScheduleMode('date');
        setSpecificDate(alarm.specificDate);
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
      setNewColor('default');
      setCustomSound(null);
      setShowAdd(true);
  };

  const toggleDay = (dayIndex: number) => {
    vibrate(HapticPatterns.tick);
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

  const formatDisplayTime = (timeStr: string) => {
      if (settings.is24Hour) return timeStr;
      const [h, m] = timeStr.split(':').map(Number);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${m.toString().padStart(2,'0')} ${suffix}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { 
        alert("File too large. Please select a sound under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setCustomSound({ name: file.name.split('.')[0], url });
          setSelectedSound('custom');
          playSound('custom', url); 
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
          customSoundUrl: selectedSound === 'custom' ? customSound?.url : undefined,
          color: newColor
      };

      if (editingId) {
          setAlarms(alarms.map(a => a.id === editingId ? alarmData : a));
      } else {
          setAlarms([...alarms, alarmData]);
      }
      vibrate(HapticPatterns.success);
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

      <div className="flex-1 overflow-y-auto no-scrollbar pb-56 space-y-4 overflow-x-hidden">
        {alarms.map(alarm => {
            const isSwiping = swipeId === alarm.id;
            const colorStyle = COLOR_STYLES[alarm.color || 'default'] || COLOR_STYLES.default;
            const cardBg = alarm.enabled ? colorStyle.bg : 'bg-surfaceContainer/30';
            const textColor = alarm.enabled ? colorStyle.text : 'text-onSurface/40';
            const indicatorColor = alarm.enabled ? colorStyle.indicator : 'bg-onSurface/10';
            const iconColor = alarm.enabled ? colorStyle.text : 'text-onSurface/40';

            return (
            <div key={alarm.id} className="relative">
                <div className="absolute inset-0 bg-error rounded-[2rem] flex items-center justify-end px-8 mb-4">
                    <Trash2 className="text-onError" size={24} />
                </div>

                <div 
                    onClick={() => openEditModal(alarm)}
                    onTouchStart={(e) => handleTouchStart(e, alarm.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)' }}
                    className={`group relative z-10 overflow-hidden rounded-[2rem] p-6 transition-all duration-300 ease-out hover:shadow-lg cursor-pointer active:scale-[0.98] mb-4 ${cardBg}`}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className={`text-5xl sm:text-6xl font-sans font-medium tracking-tight transition-colors ${textColor}`}>
                                {formatDisplayTime(alarm.time)}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className={`font-medium text-base ${textColor}`}>{alarm.label}</span>
                            <div className={`flex items-center gap-1 text-sm opacity-80 ${textColor}`}>
                                {alarm.soundId !== 'digital' && <Music size={14} className="opacity-80" />}
                                <span>•</span>
                                <span className={alarm.specificDate ? 'font-bold' : ''}>{getRepeatLabel(alarm)}</span>
                            </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => toggleAlarm(e, alarm.id)}
                            className={`w-16 h-9 sm:w-20 sm:h-10 rounded-full relative transition-colors duration-300 shrink-0 ${indicatorColor}`}
                        >
                            <div className={`absolute top-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white shadow-md transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${alarm.enabled ? 'left-[calc(100%-2rem)] sm:left-11' : 'left-1'}`} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteAlarm(alarm.id); }}
                        className={`absolute top-4 right-4 p-3 rounded-full hover:bg-white/10 transition-all duration-300 z-20 hidden sm:block opacity-0 group-hover:opacity-100 ${textColor}`}
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        )})}

        {alarms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-onSurface/30 animate-pulse">
                <BellOff size={64} className="mb-6 opacity-50" />
                <p className="text-lg font-medium">No alarms yet</p>
                <p className="text-sm">Tap + to add one</p>
            </div>
        )}
      </div>

      {!showAdd && (
          <button 
            onClick={openNewModal}
            className="fixed bottom-32 right-6 sm:right-auto sm:left-1/2 sm:-ml-10 w-20 h-20 rounded-[2rem] bg-primaryContainer text-onPrimaryContainer shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40 group"
          >
            <Plus size={36} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
      )}

      {/* Add/Edit Alarm Modal */}
      {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4">
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
                        placeholder="Label"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full bg-surfaceContainer text-onSurface p-4 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />

                      {/* Color Picker */}
                      <div>
                         <label className="text-xs text-onSurface/50 uppercase tracking-wider font-bold ml-1 mb-2 block">Color</label>
                         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {ALARM_COLORS.map(color => {
                                const style = COLOR_STYLES[color];
                                return (
                                    <button
                                        key={color}
                                        onClick={() => { setNewColor(color); vibrate(HapticPatterns.light); }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${style.bg} ${newColor === color ? `ring-2 ${style.indicator} scale-110` : 'opacity-70'}`}
                                    >
                                        {newColor === color && <div className={`w-3 h-3 rounded-full ${style.indicator}`} />}
                                    </button>
                                );
                            })}
                         </div>
                      </div>

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
                              <div className="grid grid-cols-7 gap-1 place-items-center">
                                  {getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()).map((day, i) => {
                                      if (!day) return <div key={i} />;
                                      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                      const isSelected = specificDate === dateStr;
                                      return (
                                          <button
                                            key={i}
                                            onClick={() => handleDateClick(day)}
                                            className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-primary text-onPrimary font-bold shadow-md scale-110' : 
                                                'text-onSurface hover:bg-onSurface/10'
                                            }`}
                                          >
                                              {day}
                                          </button>
                                      );
                                  })}
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

                  <div className="flex gap-4 mt-8 mb-safe">
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