
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { playNotificationSound } from '../utils/sound';

export const TimerView: React.FC = () => {
  const [inputVal, setInputVal] = useState<string>("000000"); // HHMMSS
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [isInputMode, setIsInputMode] = useState(true);
  
  const endTimeRef = useRef<number | null>(null);

  // Restore State
  useEffect(() => {
    const saved = localStorage.getItem('timer_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        setInitialTime(parsed.initialTime);
        setInputVal(parsed.inputVal);
        
        if (parsed.isActive && parsed.endTime) {
            const now = Date.now();
            const remaining = Math.ceil((parsed.endTime - now) / 1000);
            if (remaining > 0) {
                setTimeLeft(remaining);
                setIsActive(true);
                setIsInputMode(false);
                endTimeRef.current = parsed.endTime;
            } else {
                // Timer finished while backgrounded
                setTimeLeft(0);
                setIsActive(false);
                setIsInputMode(true);
                endTimeRef.current = null;
                localStorage.removeItem('timer_state');
            }
        } else if (!parsed.isInputMode && parsed.timeLeft > 0) {
            // Paused state
            setTimeLeft(parsed.timeLeft);
            setIsActive(false);
            setIsInputMode(false);
        }
    }
  }, []);

  // Save State
  useEffect(() => {
      if (isInputMode && inputVal === "000000") {
          localStorage.removeItem('timer_state');
          return;
      }
      
      const state = {
          inputVal,
          timeLeft,
          isActive,
          endTime: endTimeRef.current,
          initialTime,
          isInputMode
      };
      localStorage.setItem('timer_state', JSON.stringify(state));
  }, [inputVal, timeLeft, isActive, initialTime, isInputMode]);

  // Loop
  useEffect(() => {
    let interval: number | undefined;
    if (isActive && endTimeRef.current) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((endTimeRef.current! - now) / 1000);
        
        if (remaining <= 0) {
            playNotificationSound();
            setIsActive(false);
            setIsInputMode(true);
            endTimeRef.current = null;
            setTimeLeft(0);
            localStorage.removeItem('timer_state');
        } else {
            setTimeLeft(remaining);
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const startTimer = () => {
    if (timeLeft > 0 && !isInputMode) {
        // Resume
        const target = Date.now() + (timeLeft * 1000);
        endTimeRef.current = target;
        setIsActive(true);
        return;
    }

    const h = parseInt(inputVal.slice(0, 2));
    const m = parseInt(inputVal.slice(2, 4));
    const s = parseInt(inputVal.slice(4, 6));
    const totalSeconds = h * 3600 + m * 60 + s;

    if (totalSeconds > 0) {
      const target = Date.now() + (totalSeconds * 1000);
      setInitialTime(totalSeconds);
      setTimeLeft(totalSeconds);
      endTimeRef.current = target;
      setIsActive(true);
      setIsInputMode(false);
    }
  };

  const pauseTimer = () => {
      setIsActive(false);
      endTimeRef.current = null;
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setIsInputMode(true);
    setTimeLeft(0);
    setInitialTime(0);
    endTimeRef.current = null;
    localStorage.removeItem('timer_state');
  };

  const handleNumClick = (num: string) => {
      if (!isInputMode) return;
      setInputVal(prev => (prev + num).slice(-6));
  };

  const handleBackspace = () => {
      if (!isInputMode) return;
      setInputVal(prev => ('0' + prev).slice(0, 6));
  };

  const formatTimeDisplay = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full animate-in slide-in-from-bottom-8 duration-700 ease-expressive pb-32">
      
      {/* Display Area */}
      <div className="relative w-full aspect-square max-w-[340px] mb-8 flex items-center justify-center shrink-0">
        {/* Circular Progress Background */}
        {!isInputMode && (
             <svg className={`absolute w-full h-full transform -rotate-90 drop-shadow-2xl transition-transform duration-700 ease-spring ${isActive ? 'scale-105' : 'scale-100'}`}>
             <circle
               cx="50%"
               cy="50%"
               r="45%"
               fill="var(--color-surface-container)"
               stroke="none"
             />
             {/* Background Track */}
             <circle
               cx="50%"
               cy="50%"
               r="42%"
               fill="transparent"
               stroke="var(--color-on-surface)"
               strokeOpacity="0.1"
               strokeWidth="12"
             />
             {/* Active Progress */}
             <circle
               cx="50%"
               cy="50%"
               r="42%"
               fill="transparent"
               stroke="var(--color-primary)"
               strokeWidth="12"
               strokeDasharray="283%"
               strokeDashoffset={`${283 - (progress * 2.83)}%`}
               strokeLinecap="round"
               className={`transition-all duration-200 ease-linear ${isActive ? 'animate-pulse-slow' : ''}`}
             />
           </svg>
        )}

        {/* Time Text */}
        <div className="z-10 flex flex-col items-center">
             <div className="font-sans text-7xl sm:text-8xl font-bold text-onSurface tracking-tighter tabular-nums leading-none">
                {isInputMode 
                    ? (
                        <div className="flex gap-1">
                            <span className={inputVal.slice(0,2) !== '00' ? 'text-onSurface' : 'text-onSurface/20'}>{inputVal.slice(0,2)}</span>
                            <span className="text-onSurface/20">:</span>
                            <span className={inputVal.slice(2,4) !== '00' ? 'text-onSurface' : 'text-onSurface/20'}>{inputVal.slice(2,4)}</span>
                            <span className="text-onSurface/20">:</span>
                            <span className={inputVal.slice(4,6) !== '00' ? 'text-onSurface' : 'text-onSurface/20'}>{inputVal.slice(4,6)}</span>
                        </div>
                    )
                    : formatTimeDisplay(timeLeft)
                }
             </div>
             <span className="text-primary mt-4 font-bold text-xl uppercase tracking-widest px-4 py-1 rounded-full bg-primary/10">
                 {isInputMode ? 'Set Timer' : isActive ? 'Focusing' : 'Paused'}
             </span>
        </div>
      </div>

      {/* Input Keypad */}
      {isInputMode ? (
          <div className="grid grid-cols-3 gap-3 w-full max-w-[340px]">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                 <button 
                    key={num} 
                    onClick={() => handleNumClick(num.toString())} 
                    className="aspect-square w-full rounded-full bg-surfaceContainer text-onSurface text-4xl font-medium transition-all duration-300 hover:bg-surfaceContainerHigh active:scale-90"
                 >
                     {num}
                 </button>
             ))}
             <button onClick={handleBackspace} className="aspect-square w-full rounded-full text-onSurface/60 hover:bg-error/10 hover:text-error transition-all duration-300 active:scale-90 flex items-center justify-center font-bold uppercase text-xs tracking-widest">
                 Delete
             </button>
             <button onClick={() => handleNumClick('0')} className="aspect-square w-full rounded-full bg-surfaceContainer text-onSurface text-4xl font-medium transition-all duration-300 hover:bg-surfaceContainerHigh active:scale-90">
                 0
             </button>
             <button onClick={startTimer} className="aspect-square w-full rounded-full bg-primary text-onPrimary flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all duration-300">
                 <Play fill="currentColor" size={36} />
             </button>
          </div>
      ) : (
          /* Controls */
          <div className="flex gap-8 items-center mt-8">
             <button onClick={resetTimer} className="h-24 w-24 rounded-[2rem] bg-surfaceContainer text-onSurface flex items-center justify-center hover:bg-surfaceContainerHigh transition-all hover:rotate-180 active:scale-90 duration-500">
                 <RotateCcw size={32} />
             </button>
             <button onClick={isActive ? pauseTimer : startTimer} className="h-32 w-32 rounded-[2.5rem] bg-primary text-onPrimary flex items-center justify-center shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all active:scale-95 duration-300">
                 {isActive ? <Pause size={56} fill="currentColor" /> : <Play size={56} fill="currentColor" className="ml-2" />}
             </button>
          </div>
      )}
    </div>
  );
};
