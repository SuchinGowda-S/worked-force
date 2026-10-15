import React from 'react';
import { Menu } from 'lucide-react';
import type { NavTab } from './Navbar';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  apiHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  apiHealthy,
}) => {
  const pageTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Overview of workforce capacity, utilization, and skill gap metrics',
    },
    employees: {
      title: 'Talent Directory',
      subtitle: 'Profiles, skill proficiencies, and workload capacity management',
    },
    projects: {
      title: 'Initiatives & Projects',
      subtitle: 'Staffing requirements, skill criteria, and timeline planning',
    },
    recommendations: {
      title: 'Team Recommendations',
      subtitle: 'Explainable AI matching, combinatorial synergy, and skill coverage',
    },
    workload: {
      title: 'Workload Planner',
      subtitle: 'Burnout risk detection, capacity balancing, and reallocation simulations',
    },
    training: {
      title: 'Skills & Training',
      subtitle: 'Targeted course catalogue mapped to organizational competency gaps',
    },
  };

  const { title, subtitle } = pageTitles[currentTab] || {
    title: 'WorkForceIQ',
    subtitle: 'AI-assisted workforce management',
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: API Status Badge & Theme Switcher */}
        <div className="flex items-center gap-3">
          {/* API Health Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs">
            {apiHealthy ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">API Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">Connecting</span>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <ThemeSwitcher size="sm" />
        </div>
      </div>
    </header>
  );
};
