import React, { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  Activity,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart3,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '../lib/api';
import type { DashboardSummaryResponse } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import type { NavTab } from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, projectId?: number) => void;
  refreshTrigger: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  refreshTrigger,
}) => {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getDashboardSummary();
        setData(res);
      } catch (err) {
        console.error(err);
        setError('Failed to connect to WorkForceIQ backend. Please ensure the FastAPI server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading workforce analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 text-center shadow-lg">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Backend Connection Required</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Workload bar chart color map
  const getBarColor = (category: string) => {
    switch (category) {
      case 'overloaded':
        return '#f43f5e'; // rose-500
      case 'optimal':
        return '#10b981'; // emerald-500
      case 'underutilized':
        return '#f59e0b'; // amber-500
      default:
        return '#6366f1';
    }
  };

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border transition-all duration-300 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/60 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/30 border-indigo-200/70 dark:border-indigo-500/20 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="primary" size="sm">Decision Support Engine</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">Real-Time Workspace Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workforce Planning & Optimization
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Simulate staffing feasibility, match complementary skills, and rebalance utilization before committing organizational changes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/25"
          >
            <Sparkles className="w-4 h-4 text-indigo-100" />
            <span>Staff an Initiative</span>
          </button>
          <button
            onClick={() => onNavigate('workload')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 transition shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Balance Workload</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Workforce"
          value={data.employee_count}
          subtitle="Engineers & Specialists"
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          accent="indigo"
          badge="Active Pool"
        />
        <StatCard
          title="Active Projects"
          value={data.active_projects_count}
          subtitle="Currently staffed"
          icon={<Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          accent="emerald"
          badge="In Flight"
        />
        <StatCard
          title="Average Utilization"
          value={`${data.avg_utilization_percent}%`}
          subtitle="Target threshold: 70–90%"
          icon={<Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          accent="amber"
          badge={data.avg_utilization_percent > 85 ? 'High Demand' : 'Healthy'}
        />
        <StatCard
          title="Skill Gaps Detected"
          value={data.unresolved_skill_gaps}
          subtitle="Requires staffing or training"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          accent="rose"
          badge="Needs Review"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Distribution Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Workload Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Staff utilization across weekly capacity intervals
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Overloaded
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Optimal
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Underutilized
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.workload_distribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{item.range}</p>
                          <p className="text-slate-600 dark:text-slate-300 mt-1">
                            Staff count: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.count}</span>
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] capitalize">Category: {item.category}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.workload_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Gap Summary / Priority Needs */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Unresolved Skill Gaps
              </h2>
              <button
                onClick={() => onNavigate('training')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Catalogue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Project requirements currently lacking confirmed coverage:
            </p>

            <div className="space-y-2.5">
              {data.skill_gap_summary.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center text-xs text-slate-500 dark:text-slate-400">
                  No critical skill gaps detected.
                </div>
              ) : (
                data.skill_gap_summary.map((gap, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        {gap.skill_name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Required in {gap.count} project{gap.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant={gap.count >= 2 ? 'danger' : 'warning'} size="sm">
                      {gap.category}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onNavigate('training')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-2 transition"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Explore Training Solutions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects & Staffing Quick Action */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Active & Planning Initiatives
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review current allocations or generate combinatorial team recommendations
            </p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            All Initiatives <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Initiative</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Team Size</th>
                <th className="pb-3 font-semibold">Weekly Effort</th>
                <th className="pb-3 font-semibold">Staffing Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.recent_projects.map((proj) => {
                const isFullyStaffed =
                  (proj.assigned_employees?.length || 0) >= proj.team_size;
                return (
                  <tr key={proj.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{proj.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">
                        {proj.description}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge
                        variant={
                          proj.status === 'active'
                            ? 'success'
                            : proj.status === 'planning'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {proj.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-700 dark:text-slate-300 font-medium">
                      {proj.team_size} members
                    </td>
                    <td className="py-3.5 pr-4 text-slate-700 dark:text-slate-300 font-medium">
                      {proj.estimated_effort_hours_per_week} hrs/wk
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isFullyStaffed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {proj.assigned_employees?.length || 0} / {proj.team_size}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">assigned</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onNavigate('recommendations', proj.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-500/30 transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Find Best Team</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
