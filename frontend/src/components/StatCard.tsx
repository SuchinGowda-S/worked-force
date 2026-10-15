import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'indigo',
  badge,
}) => {
  const accentGlow = {
    indigo: 'from-indigo-500/15 to-transparent text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50',
    emerald: 'from-emerald-500/15 to-transparent text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
    amber: 'from-amber-500/15 to-transparent text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
    rose: 'from-rose-500/15 to-transparent text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
    cyan: 'from-cyan-500/15 to-transparent text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/50',
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900/80 p-6 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 backdrop-blur-md">
      <div
        className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br ${accentGlow[accent]} rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition`}
      />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h4>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border transition-colors ${accentGlow[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
