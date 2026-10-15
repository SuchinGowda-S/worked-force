import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '', size = 'md' }) => {
  const { theme, setTheme } = useTheme();

  const options: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Light',
      icon: <Sun className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    {
      id: 'system',
      label: 'System',
      icon: <Laptop className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: <Moon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800/80 backdrop-blur-md transition-colors ${className}`}
    >
      {options.map((opt) => {
        const active = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${opt.label} Mode`}
            onClick={() => setTheme(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              active
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/40 dark:hover:bg-slate-800/50'
            }`}
          >
            {opt.icon}
            <span className="hidden sm:inline text-[11px]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
