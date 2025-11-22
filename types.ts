
export enum AppMode {
  CLOCK = 'CLOCK',
  ALARM = 'ALARM',
  TIMER = 'TIMER',
  POMODORO = 'POMODORO',
  TASKS = 'TASKS',
  SETTINGS = 'SETTINGS',
}

export interface AppSettings {
  is24Hour: boolean;
  volume: number; // 0.0 to 1.0
}

export interface Alarm {
  id: string;
  time: string; // HH:mm format (always stored as 24h)
  label: string;
  enabled: boolean;
  days: number[]; // 0-6 (Sun-Sat)
  specificDate?: string; // YYYY-MM-DD for one-time specific date alarms
  soundId: string;
  customSoundUrl?: string;
  customSoundName?: string;
  color?: string;
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TaskTag {
  WORK = 'Work',
  PERSONAL = 'Personal',
  SHOPPING = 'Shopping',
  HEALTH = 'Health',
  OTHER = 'Other'
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tag: TaskTag;
  createdAt: number;
  timeSpent?: number; // Accumulated focus time in minutes
}

export const SOUND_OPTIONS = [
  { id: 'digital', name: 'Digital' },
  { id: 'chime', name: 'Soft Chime' },
  { id: 'pulse', name: 'Deep Pulse' },
];

export enum PomodoroMode {
  FOCUS = 'Focus',
  SHORT_BREAK = 'Short Break',
  LONG_BREAK = 'Long Break',
}

export interface PomodoroStat {
  date: string; // YYYY-MM-DD
  minutes: number;
  sessions: number;
}

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  surface: string;
  onSurface: string;
  surfaceContainer: string;
}

export const THEMES: Record<AppMode, ThemeColors> = {
  [AppMode.CLOCK]: {
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    surface: '#141218',
    onSurface: '#E6E1E5',
    surfaceContainer: '#211F26',
  },
  [AppMode.ALARM]: {
    primary: '#FFB59D',
    onPrimary: '#5D1900',
    primaryContainer: '#842500',
    onPrimaryContainer: '#FFDBCF',
    surface: '#1A110F',
    onSurface: '#F1DFDA',
    surfaceContainer: '#271D1B',
  },
  [AppMode.TIMER]: {
    primary: '#80D9FF',
    onPrimary: '#00344B',
    primaryContainer: '#004D6D',
    onPrimaryContainer: '#BFE8FF',
    surface: '#101417',
    onSurface: '#DEE3E7',
    surfaceContainer: '#1C2024',
  },
  [AppMode.POMODORO]: {
    primary: '#FFB3AD',
    onPrimary: '#680003',
    primaryContainer: '#930006',
    onPrimaryContainer: '#FFDAD4',
    surface: '#1A1111',
    onSurface: '#F1DEDC',
    surfaceContainer: '#271D1D',
  },
  [AppMode.TASKS]: {
    primary: '#6DD58C',
    onPrimary: '#00391C',
    primaryContainer: '#00522B',
    onPrimaryContainer: '#89F2A6',
    surface: '#111411',
    onSurface: '#E1E3DF',
    surfaceContainer: '#1D211E',
  },
  [AppMode.SETTINGS]: {
    primary: '#E6E0E9',
    onPrimary: '#322F35',
    primaryContainer: '#49454F',
    onPrimaryContainer: '#E6E0E9',
    surface: '#141218',
    onSurface: '#E6E1E5',
    surfaceContainer: '#211F26',
  },
};
