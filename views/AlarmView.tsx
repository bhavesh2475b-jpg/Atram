
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

const COLOR_STYLES: Record<string, { bg: string, text: string, indicator: string, activeCard: string }> = {
    default: { bg: 'bg-surfaceContainer', text: 'text-onSurface', indicator: 'bg-primary', activeCard: 'bg-surfaceContainerHigh' },
    red: { bg: 'bg-rose-900/20', text: 'text-rose-100', indicator: 'bg-rose-300', activeCard: 'bg-rose-700' },
    orange: { bg: 'bg-orange-900/20', text: 'text-orange-100', indicator: 'bg-orange-300', activeCard: 'bg-orange-700' },
    yellow: { bg: 'bg-amber-900/20', text: 'text-amber-100', indicator: 'bg-amber-300', activeCard: 'bg-amber-700' },
    green: { bg: 'bg-emerald-900/20', text: 'text-emerald-100', indicator: 'bg-emerald-300', activeCard: 'bg-emerald-700' },
    blue: { bg: 'bg-blue-900/20', text: 'text-blue-100', indicator: 'bg-blue-300', activeCard: 'bg-blue-700' },
    purple: { bg: 'bg-violet-900/20', text: 'text-violet-100', indicator: 'bg-violet-300', activeCard: 'bg-violet-700' },
    pink: { bg: 'bg-fuchsia-900/20', text: 'text-fuchsia-100', indicator: 'bg-fuchsia-300', activeCard: 'bg-fuchsia-700' },
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

  // Calendar Helpers (Same as before)
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
        <h2 className="text-5xl font-medium text-onSurface tracking-tight">Alarms</h2>
        <button 
            onClick={openNewModal}
            className="w-14 h-14 rounded-[1.2rem] bg-primaryContainer text-onPrimaryContainer shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
            <Plus size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-40 space-y-4 overflow-x-hidden">
        {alarms.map(alarm => {
            const isSwiping = swipeId === alarm.id;
            const colorStyle = COLOR_STYLES[alarm.color || 'default'] || COLOR_STYLES.default;
            // Expressive Change: Active alarms get full saturated color background
            const cardBg = alarm.enabled ? colorStyle.activeCard : 'bg-surfaceContainer';
            const textColor = alarm.enabled ? 'text-white' : 'text-onSurface/60';
            const toggleBg = alarm.enabled ? 'bg-white/30' : 'bg-surface';
            const thumbColor = alarm.enabled ? 'bg-white' : 'bg-onSurface/40';

            return (
            <div key={alarm.id} className="relative">
                <div className="absolute inset-0 bg-error rounded-[2.5rem] flex items-center justify-end px-8 mb-4">
                    <Trash2 className="text-onError" size={28} />
                </div>

                <div 
                    onClick={() => openEditModal(alarm)}
                    onTouchStart={(e) => handleTouchStart(e, alarm.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)' }}
                    className={`group relative z-10 overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500 ease-spring cursor-pointer active:scale-[0.98] mb-4 ${cardBg}`}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <span className={`text-7xl font-sans font-medium tracking-tighter leading-none transition-colors ${textColor}`}>
                                {formatDisplayTime(alarm.time).split(' ')[0]}
                                <span className="text-2xl ml-1 font-normal opacity-60">
                                    {settings.is24Hour ? '' : formatDisplayTime(alarm.time).split(' ')[1]}
                                </span>
                            </span>
                            <div className={`flex flex-col mt-2 ${textColor}`}>
                                <span className="font-medium text-lg opacity-90">{alarm.label}</span>
                                <div className="flex items-center gap-2 text-sm opacity-70 font-medium">
                                    {alarm.soundId !== 'digital' && <Music size={14} />}
                                    <span>{getRepeatLabel(alarm)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => toggleAlarm(e, alarm.id)}
                            className={`w-24 h-14 rounded-full relative transition-colors duration-300 shrink-0 ${toggleBg}`}
                        >
                            <div className={`absolute top-2 h-10 w-10 rounded-full shadow-sm transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${thumbColor} ${alarm.enabled ? 'translate-x-12' : 'translate-x-2'}`} >
                                {alarm.enabled ? <CheckIcon size={24} className="text-black p-1" /> : <div />}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )})}

        {alarms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-onSurface/30">
                <BellOff size={80} className="mb-6 opacity-30" strokeWidth={1} />
                <p className="text-2xl font-medium">No alarms</p>
            </div>
        )}
      </div>

      {/* Add/Edit Alarm Modal */}
      {showAdd && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center sm:p-4">
              <div className="bg-surface w-full max-w-md sm:rounded-[3rem] rounded-t-[3rem] p-6 sm:p-10 animate-in slide-in-from-bottom-32 duration-500 shadow-2xl max-h-[95vh] overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-4xl text-onSurface font-medium">{editingId ? 'Edit' : 'New'}</h3>
                     <button onClick={() => setShowAdd(false)} className="p-4 bg-surfaceContainer rounded-full hover:bg-surfaceContainerHigh">
                        <ChevronLeft size={24} />
                     </button>
                  </div>
                  
                  <div className="space-y-8">
                      {/* Time Input */}
                      <div className="flex justify-center py-4">
                          <input 
                            type="time" 
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="bg-transparent text-center text-onSurface text-8xl font-bold p-0 focus:outline-none font-sans tracking-tighter w-full"
                          />
                      </div>

                      {/* Label Input */}
                      <div className="bg-surfaceContainer p-2 rounded-[2rem]">
                        <input 
                            type="text" 
                            placeholder="Alarm Label"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="w-full bg-transparent text-center text-onSurface p-4 text-xl font-medium focus:outline-none placeholder:text-onSurface/30"
                        />
                      </div>

                      {/* Color Picker */}
                      <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar py-2">
                            {ALARM_COLORS.map(color => {
                                const style = COLOR_STYLES[color];
                                const isSelected = newColor === color;
                                return (
                                    <button
                                        key={color}
                                        onClick={() => { setNewColor(color); vibrate(HapticPatterns.light); }}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${style.bg} ${isSelected ? 'scale-110 ring-4 ring-offset-2 ring-offset-surface ring-onSurface/20' : 'opacity-60'}`}
                                    >
                                        {isSelected && <div className={`w-6 h-6 rounded-full ${style.indicator}`} />}
                                    </button>
                                );
                            })}
                      </div>

                      {/* Schedule Mode Tabs */}
                      <div className="bg-surfaceContainer p-2 rounded-[2rem] flex">
                          <button 
                            onClick={() => setScheduleMode('weekly')}
                            className={`flex-1 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${scheduleMode === 'weekly' ? 'bg-onSurface text-surface shadow-md' : 'text-onSurface/60 hover:text-onSurface'}`}
                          >
                            Weekly
                          </button>
                          <button 
                             onClick={() => setScheduleMode('date')}
                             className={`flex-1 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${scheduleMode === 'date' ? 'bg-onSurface text-surface shadow-md' : 'text-onSurface/60 hover:text-onSurface'}`}
                          >
                            One Time
                          </button>
                      </div>

                      {/* Weekly View */}
                      {scheduleMode === 'weekly' && (
                          <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-4">
                             <div className="flex justify-between gap-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                                    <button
                                    key={index}
                                    onClick={() => toggleDay(index)}
                                    className={`flex-1 aspect-square rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${
                                        newDays.includes(index) 
                                        ? 'bg-primaryContainer text-onPrimaryContainer' 
                                        : 'bg-surfaceContainer text-onSurface/40'
                                    }`}
                                    >
                                    {label}
                                    </button>
                                ))}
                             </div>
                          </div>
                      )}

                      {/* Calendar View */}
                      {scheduleMode === 'date' && (
                          <div className="bg-surfaceContainer rounded-[2.5rem] p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex justify-between items-center mb-4 px-2">
                                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-onSurface/10 rounded-full"><ChevronLeft size={24} /></button>
                                  <span className="font-bold text-xl text-onSurface">
                                      {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                  </span>
                                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-onSurface/10 rounded-full"><ChevronRight size={24} /></button>
                              </div>
                              <div className="grid grid-cols-7 gap-2 place-items-center">
                                  {getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()).map((day, i) => {
                                      if (!day) return <div key={i} />;
                                      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                      const isSelected = specificDate === dateStr;
                                      return (
                                          <button
                                            key={i}
                                            onClick={() => handleDateClick(day)}
                                            className={`w-10 h-10 rounded-full text-sm flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-primary text-onPrimary font-bold scale-110 shadow-lg' : 
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

                      {/* Sound Selector */}
                      <div className="bg-surfaceContainer p-6 rounded-[2rem]">
                        <h4 className="text-onSurface/60 text-sm font-bold uppercase tracking-widest mb-4">Ringtone</h4>
                        <div className="flex flex-wrap gap-3">
                          {SOUND_OPTIONS.map(sound => (
                            <button
                              key={sound.id}
                              onClick={() => { setSelectedSound(sound.id); playSound(sound.id); }}
                              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${selectedSound === sound.id ? 'bg-onSurface text-surface' : 'bg-surface text-onSurface/60'}`}
                            >
                              {sound.name}
                            </button>
                          ))}
                          <button 
                             onClick={() => fileInputRef.current?.click()}
                             className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${selectedSound === 'custom' ? 'bg-onSurface text-surface' : 'bg-surface text-onSurface/60'}`}
                          >
                              {selectedSound === 'custom' && customSound ? customSound.name : 'Upload'}
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                        </div>
                      </div>
                  </div>

                  <button onClick={saveAlarm} className="w-full mt-10 py-6 rounded-[2.5rem] bg-primary text-onPrimary text-xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mb-safe">
                      Save Alarm
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper icon
const CheckIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
