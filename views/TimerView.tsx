
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { playNotificationSound } from '../utils/sound';

export const TimerView: React.FC = () => {
  const [inputVal, setInputVal] = useState<string>("000000"); // HHMMSS
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [isInputMode, setIsInputMode] = useState(true);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                playNotificationSound();
                setIsActive(false);
                setIsInputMode(true);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsInputMode(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTimer = () => {
    if (timeLeft > 0) {
        setIsActive(true);
        setIsInputMode(false);
        return;
    }

    const h = parseInt(inputVal.slice(0, 2));
    const m = parseInt(inputVal.slice(2, 4));
    const s = parseInt(inputVal.slice(4, 6));
    const totalSeconds = h * 3600 + m * 60 + s;

    if (totalSeconds > 0) {
      setInitialTime(totalSeconds);
      setTimeLeft(totalSeconds);
      setIsActive(true);
      setIsInputMode(false);
    }
  };

  const pauseTimer = () => setIsActive(false);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsInputMode(true);
    setTimeLeft(0);
    setInitialTime(0);
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
    <div className="h-full flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Display Area */}
      <div className="relative w-full aspect-square max-w-[320px] mb-8 flex items-center justify-center">
        {/* Circular Progress Background */}
        {!isInputMode && (
             <svg className={`absolute w-full h-full transform -rotate-90 drop-shadow-2xl transition-transform duration-700 ease-out ${isActive ? 'scale-105' : 'scale-100'}`}>
             <circle
               cx="50%"
               cy="50%"
               r="45%"
               fill="transparent"
               stroke="currentColor"
               strokeWidth="20"
               className="text-surfaceContainer"
             />
             <circle
               cx="50%"
               cy="50%"
               r="45%"
               fill="transparent"
               stroke="currentColor"
               strokeWidth="20"
               strokeDasharray="283%"
               strokeDashoffset={`${283 - (progress * 2.83)}%`}
               strokeLinecap="round"
               className={`text-primary transition-all duration-1000 ease-linear ${isActive ? 'animate-pulse-slow' : ''}`}
             />
           </svg>
        )}

        {/* Time Text */}
        <div className="z-10 flex flex-col items-center">
             <div className="font-mono text-6xl sm:text-8xl font-bold text-onSurface tracking-tighter tabular-nums">
                {isInputMode 
                    ? `${inputVal.slice(0,2)}:${inputVal.slice(2,4)}:${inputVal.slice(4,6)}`
                    : formatTimeDisplay(timeLeft)
                }
             </div>
             <span className="text-onSurface/50 mt-2 font-medium text-xl uppercase tracking-widest">
                 {isInputMode ? 'Set Timer' : isActive ? 'Running' : 'Paused'}
             </span>
        </div>
      </div>

      {/* Input Keypad */}
      {isInputMode ? (
          <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] mb-20">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                 <button 
                    key={num} 
                    onClick={() => handleNumClick(num.toString())} 
                    className="h-20 w-full rounded-[1.5rem] bg-surfaceContainer hover:bg-primaryContainer hover:text-onPrimaryContainer text-onSurface text-3xl font-medium transition-all duration-200 active:scale-95"
                 >
                     {num}
                 </button>
             ))}
             <button onClick={handleBackspace} className="h-20 w-full rounded-[1.5rem] text-onSurface/60 hover:bg-error/10 hover:text-error transition-all duration-200 active:scale-95 flex items-center justify-center font-medium uppercase text-sm tracking-wider">
                 Del
             </button>
             <button onClick={() => handleNumClick('0')} className="h-20 w-full rounded-[1.5rem] bg-surfaceContainer hover:bg-primaryContainer hover:text-onPrimaryContainer text-onSurface text-3xl font-medium transition-all duration-200 active:scale-95">
                 0
             </button>
             <button onClick={startTimer} className="h-20 w-full rounded-[1.5rem] bg-primary text-onPrimary flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                 <Play fill="currentColor" size={32} />
             </button>
          </div>
      ) : (
          /* Controls */
          <div className="flex gap-6 mb-24 items-center">
             <button onClick={resetTimer} className="h-20 w-20 rounded-[2rem] bg-surfaceContainer text-onSurface flex items-center justify-center hover:bg-surfaceContainer/80 transition-all hover:scale-105 active:scale-95">
                 <RotateCcw size={28} />
             </button>
             <button onClick={isActive ? pauseTimer : startTimer} className="h-28 w-28 rounded-[2.5rem] bg-primary text-onPrimary flex items-center justify-center shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all active:scale-95">
                 {isActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
             </button>
          </div>
      )}
    </div>
  );
};
