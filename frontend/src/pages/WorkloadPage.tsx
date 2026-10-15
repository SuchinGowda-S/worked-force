import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Users,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import type { WorkloadSummaryResponse, ReallocationSuggestion } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface WorkloadPageProps {
  onRefreshData: () => void;
  refreshTrigger: number;
}

export const WorkloadPage: React.FC<WorkloadPageProps> = ({
  onRefreshData,
  refreshTrigger,
}) => {
  const [data, setData] = useState<WorkloadSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overloaded' | 'underutilized' | 'optimal'>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<ReallocationSuggestion | null>(null);
  const [applying, setApplying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWorkload = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.getWorkload();
      setData(res);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setFetchError(typeof detail === 'string' ? detail : 'Failed to load workload metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, [refreshTrigger]);

  const handleApplyReallocation = async () => {
    if (!selectedSuggestion) return;
    try {
      setApplying(true);
      setActionError(null);
      const res = await api.applyReallocation(selectedSuggestion);
      setActionSuccess(res.message);
      setSelectedSuggestion(null);
      onRefreshData();
      fetchWorkload();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Failed to apply workload reallocation.');
    } finally {
      setApplying(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
        Calculating organizational workload and capacity metrics...
      </div>
    );
  }

  if (!data) return null;

  const filteredEmployees = data.employees.filter((e) => {
    if (filter === 'all') return true;
    return e.status_category === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Workload Balancing & Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor capacity thresholds, detect burnout risks, and evaluate proposed reallocations with before/after simulation
          </p>
        </div>

        {/* Quick Summary Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold">
            {data.overloaded_count} Overloaded (&gt;100%)
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-semibold">
            {data.underutilized_count} Underutilized (&lt;70%)
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            {data.optimal_count} Optimal
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Reallocation Suggestions Panel */}
      {data.suggestions.length > 0 && (
        <div className="rounded-2xl p-6 border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/60 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-indigo-950/20 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Recommended Workload Reallocations
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Targeted project transfers to relieve over-capacity engineers using qualified underutilized colleagues
              </p>
            </div>
            <Badge variant="primary" size="sm">
              {data.suggestions.length} proposal{data.suggestions.length > 1 ? 's' : ''} available
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Initiative: {sug.project_name}
                    </span>
                    <Badge variant="warning" size="sm">
                      Transfer: {sug.hours_to_transfer} hrs/wk
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{sug.reason}</p>

                  {/* Before / After Comparison Visual */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs mb-4">
                    {/* From Person */}
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        Relieving (From)
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{sug.from_employee_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{sug.before_utilization_from}%</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sug.after_utilization_from}%</span>
                      </div>
                    </div>

                    {/* To Person */}
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        Assigning To
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{sug.to_employee_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{sug.before_utilization_to}%</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sug.after_utilization_to}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedSuggestion(sug)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
                  >
                    Review & Apply Reallocation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Capacity Visualizer */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Employee Capacity & Assignments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live utilization meters across all active staff
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({data.total_employees})
            </button>
            <button
              onClick={() => setFilter('overloaded')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'overloaded'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overloaded ({data.overloaded_count})
            </button>
            <button
              onClick={() => setFilter('optimal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'optimal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Optimal ({data.optimal_count})
            </button>
            <button
              onClick={() => setFilter('underutilized')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'underutilized'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Underutilized ({data.underutilized_count})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEmployees.map((emp) => {
            const isOver = emp.status_category === 'overloaded';
            const isUnder = emp.status_category === 'underutilized';

            return (
              <div
                key={emp.employee_id}
                className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-700 dark:text-white text-xs">
                      {emp.display_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {emp.display_name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{emp.role} • {emp.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-slate-400">Assigned Load: </span>
                      <strong className="text-slate-900 dark:text-white">
                        {emp.assigned_hours} / {emp.weekly_capacity_hours} hrs
                      </strong>
                    </div>
                    <Badge
                      variant={isOver ? 'danger' : isUnder ? 'warning' : 'success'}
                      size="sm"
                    >
                      {emp.utilization_percent}% Utilized
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, emp.utilization_percent)}%` }}
                  />
                </div>

                {/* Active Assignments Chips */}
                {emp.assignments.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Assignments:
                    </span>
                    {emp.assignments.map((assign, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        {assign.project_name}:{' '}
                        <strong className="text-indigo-600 dark:text-indigo-300">{assign.allocated_hours}h/wk</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">No active project assignments. Available for allocation.</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal for Reallocation */}
      <Modal
        isOpen={selectedSuggestion !== null}
        onClose={() => setSelectedSuggestion(null)}
        title="Confirm Workload Reallocation"
        description="Review projected impact before applying allocation adjustments."
      >
        {selectedSuggestion && (
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <p className="text-slate-600 dark:text-slate-300">
              Transfer <strong className="text-indigo-600 dark:text-indigo-400">{selectedSuggestion.hours_to_transfer} hours/week</strong>{' '}
              on project <strong className="text-slate-900 dark:text-white">{selectedSuggestion.project_name}</strong>:
            </p>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">From Employee</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedSuggestion.from_employee_name}</p>
                <div className="mt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Current: </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">{selectedSuggestion.before_utilization_from}%</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Projected: </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedSuggestion.after_utilization_from}%</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">To Employee</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedSuggestion.to_employee_name}</p>
                <div className="mt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Current: </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{selectedSuggestion.before_utilization_to}%</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Projected: </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedSuggestion.after_utilization_to}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyReallocation}
                disabled={applying}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                {applying ? 'Applying Transfer...' : 'Confirm Reallocation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
