
import React from 'react';
import { AppSettings } from '../types';
import { Volume2, Clock, Moon } from 'lucide-react';
import { vibrate, HapticPatterns } from '../utils/haptics';
import { playNotificationSound } from '../utils/sound';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setSettings(prev => ({ ...prev, volume: newVol }));
  };

  const toggle24Hour = () => {
    vibrate(HapticPatterns.light);
    setSettings(prev => ({ ...prev, is24Hour: !prev.is24Hour }));
  };

  const testSound = () => {
    vibrate(HapticPatterns.medium);
    playNotificationSound();
  };

  return (
    <div className="h-full w-full max-w-2xl mx-auto p-6 flex flex-col relative animate-in fade-in duration-500">
       <h2 className="text-4xl font-medium text-onSurface mb-8">Settings</h2>

       <div className="space-y-6">
          
          {/* Volume Control */}
          <div className="bg-surfaceContainer rounded-[2rem] p-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-surfaceContainer/50 text-onSurface">
                   <Volume2 size={24} />
                </div>
                <span className="text-xl font-medium text-onSurface">Master Volume</span>
             </div>
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={settings.volume}
                onChange={handleVolumeChange}
                onMouseUp={testSound}
                onTouchEnd={testSound}
                className="w-full h-6 bg-surface/50 rounded-full appearance-none cursor-pointer accent-primary"
             />
             <div className="flex justify-between text-xs text-onSurface/40 mt-2 px-2">
                <span>Silent</span>
                <span>50%</span>
                <span>Max</span>
             </div>
          </div>

          {/* Time Format */}
          <button 
            onClick={toggle24Hour}
            className="w-full bg-surfaceContainer rounded-[2rem] p-6 flex items-center justify-between hover:bg-surfaceContainer/80 transition-all active:scale-[0.98]"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-surfaceContainer/50 text-onSurface">
                   <Clock size={24} />
                </div>
                <div className="text-left">
                    <span className="block text-xl font-medium text-onSurface">24-Hour Clock</span>
                    <span className="text-sm text-onSurface/60">Use 14:00 instead of 2:00 PM</span>
                </div>
             </div>
             <div className={`w-16 h-9 rounded-full relative transition-colors duration-300 ${settings.is24Hour ? 'bg-primary' : 'bg-onSurface/20'}`}>
                 <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-md transition-transform duration-300 ${settings.is24Hour ? 'translate-x-8' : 'translate-x-1'}`} />
             </div>
          </button>

          {/* Theme Hint */}
          <div className="bg-surfaceContainer/30 rounded-[2rem] p-6 flex items-center gap-4 opacity-60">
             <div className="p-3 rounded-full bg-surfaceContainer/50 text-onSurface">
                <Moon size={24} />
             </div>
             <div>
                 <span className="block text-lg font-medium text-onSurface">Dynamic Theme</span>
                 <span className="text-sm text-onSurface/60">Colors change based on active mode</span>
             </div>
          </div>
       </div>
       
       <div className="mt-auto text-center text-onSurface/20 text-sm pb-20">
          <p>ChronoFlow v1.2</p>
       </div>
    </div>
  );
};
