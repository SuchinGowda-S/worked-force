import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  GraduationCap,
  Info,
  Check,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Project, RecommendationResponse } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface RecommendationsPageProps {
  initialProjectId?: number;
  onNavigateToTraining: () => void;
  onRefreshData: () => void;
  refreshTrigger: number;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  initialProjectId,
  onNavigateToTraining,
  onRefreshData,
  refreshTrigger,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjectId || null
  );
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.getProjects();
        setProjects(res);
        if (!selectedProjectId && res.length > 0) {
          setSelectedProjectId(res[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, [refreshTrigger]);

  // Run recommendation whenever selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchRecommendation = async () => {
      try {
        setLoading(true);
        setApplySuccess(null);
        setFetchError(null);
        const res = await api.recommendTeam(selectedProjectId);
        setRecommendation(res);
      } catch (err: any) {
        console.error(err);
        const detail = err?.response?.data?.detail;
        setFetchError(typeof detail === 'string' ? detail : 'Failed to generate recommendation for project.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendation();
  }, [selectedProjectId, refreshTrigger]);

  const handleApplyTeam = async () => {
    if (!recommendation || !selectedProjectId) return;
    try {
      setApplying(true);
      setApplyError(null);
      const employeeIds = recommendation.selected_team.map((m) => m.employee_id);
      const res = await api.applyRecommendedTeam(selectedProjectId, employeeIds);
      setApplySuccess(res.message);
      setShowApplyModal(false);
      onRefreshData();
      // Refetch recommendation
      const updated = await api.recommendTeam(selectedProjectId);
      setRecommendation(updated);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setApplyError(typeof detail === 'string' ? detail : 'Failed to apply assignments.');
    } finally {
      setApplying(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/60 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/30 border-indigo-200/70 dark:border-indigo-500/20 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="primary" size="sm">Deterministic Constraint Optimizer</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Multi-Criteria Decision Support</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            AI Team Recommendation Engine
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Optimizes for mandatory skill coverage, complementary strengths, and capacity limits without black-box bias.
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Initiative:
          </label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
            className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-indigo-500/40 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 shadow-sm transition"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.team_size} members)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Algorithm Transparency & Explainability Callout */}
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900 dark:text-white block">
            Transparent Scoring Formula & Decision-Support Notice:
          </span>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Individual fit scores are computed transparently as: <strong className="text-slate-900 dark:text-slate-200">Skill Fit (50%)</strong> + <strong className="text-slate-900 dark:text-slate-200">Experience (20%)</strong> + <strong className="text-slate-900 dark:text-slate-200">Availability (20%)</strong> + <strong className="text-slate-900 dark:text-slate-200">Workload Suitability (10%)</strong>.
            Scores are decision-support estimates to guide managers, not objective rankings of human worth.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {applySuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{applySuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          Evaluating candidate pool and complementary skill sets...
        </div>
      ) : !recommendation ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
          No recommendation available. Select a project to begin.
        </div>
      ) : (
        <>
          {/* Feasibility Alert Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
              recommendation.is_feasible
                ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  recommendation.is_feasible
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
              >
                {recommendation.is_feasible ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {recommendation.is_feasible
                      ? 'Feasible Team Identified'
                      : 'Recommendation Generated with Constraints'}
                  </span>
                  <Badge variant={recommendation.is_feasible ? 'success' : 'warning'} size="sm">
                    Team Score: {recommendation.total_team_score}%
                  </Badge>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {recommendation.is_feasible
                    ? `All ${selectedProject?.team_size} members identified with full mandatory skill coverage.`
                    : recommendation.constraints_violated.join(' ')}
                </p>
              </div>
            </div>

            {recommendation.selected_team.length > 0 && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/30 self-start sm:self-auto shrink-0"
              >
                Staff Recommended Team
              </button>
            )}
          </div>

          {/* Recommended Team Members Grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Selected Recommended Team ({recommendation.selected_team.length} members)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by marginal complementary gain & fit score
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendation.selected_team.map((member) => (
                <div
                  key={member.employee_id}
                  className="rounded-2xl p-5 bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-500/30 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {member.display_name}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{member.department}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                          {member.overall_score}%
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                          Match Score
                        </span>
                      </div>
                    </div>

                    {/* Component Score Bars */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 mb-3 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Skill Fit (50%):</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">
                          {member.component_scores.skill_fit}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full"
                          style={{ width: `${member.component_scores.skill_fit}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500 dark:text-slate-400">Experience (20%):</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">
                          {member.component_scores.experience}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-violet-600 dark:bg-violet-500 h-full rounded-full"
                          style={{ width: `${member.component_scores.experience}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500 dark:text-slate-400">Availability (20%):</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">
                          {member.component_scores.availability}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full"
                          style={{ width: `${member.component_scores.availability}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500 dark:text-slate-400">Workload Fit (10%):</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">
                          {member.component_scores.workload}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-600 dark:bg-amber-500 h-full rounded-full"
                          style={{ width: `${member.component_scores.workload}%` }}
                        />
                      </div>
                    </div>

                    {/* Rationale explanation */}
                    <div className="mb-3 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300">
                      <span className="font-semibold block text-indigo-700 dark:text-indigo-200 text-[11px] mb-0.5">
                        Selection Rationale:
                      </span>
                      {member.rationale}
                    </div>

                    {/* Matched Skills */}
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Matched Competencies
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.matched_skills.map((ms, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1 ${
                              ms.proficiency >= ms.required_proficiency
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            <span>{ms.skill_name}</span>
                            <span className="font-bold">Lvl {ms.proficiency}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Capacity & Projected Utilization Footer */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Cap: {member.remaining_capacity}h avail
                    </span>
                    <span
                      className={`font-semibold ${
                        member.projected_utilization > 100
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      Projected: {member.projected_utilization}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Coverage Matrix */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Project Skill Coverage Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Demonstrates team coverage for each required competency and highlights any remaining gaps
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Skill Requirement</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Required Level</th>
                    <th className="pb-3 font-semibold">Team Best Level</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Covering Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recommendation.skill_coverage.map((item) => (
                    <tr key={item.skill_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {item.skill_name}
                      </td>
                      <td className="py-3">
                        <Badge variant={item.is_mandatory ? 'primary' : 'neutral'} size="sm">
                          {item.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">Level {item.required_proficiency}</td>
                      <td className="py-3 text-slate-900 dark:text-slate-200 font-bold">Level {item.best_team_proficiency}</td>
                      <td className="py-3">
                        {item.is_covered ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Covered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                            <X className="w-3.5 h-3.5" /> Uncovered Gap
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {item.covering_members.join(', ') || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Targeted Training Recommendations for Missing Skills */}
          {recommendation.recommended_courses.length > 0 && (
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Targeted Training for Identified Gaps
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recommended courses from the local training catalogue to bridge team proficiency shortfalls
                  </p>
                </div>
                <button
                  onClick={onNavigateToTraining}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  View Catalogue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendation.recommended_courses.map((course) => (
                  <div
                    key={course.course_id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <Badge variant="warning" size="sm">
                          {course.skill_name}
                        </Badge>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.estimated_hours} hrs
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{course.title}</h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">{course.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-300 italic">
                      {course.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Excluded & Lower Ranked Candidates Analysis */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Candidate Pool & Exclusion Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Transparent rationale for candidates not included in the primary team recommendation
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Candidate</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Fit Score</th>
                    <th className="pb-3 font-semibold">Available Capacity</th>
                    <th className="pb-3 font-semibold">Reason Not Selected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recommendation.candidate_rankings
                    .filter((c) => !c.is_selected)
                    .slice(0, 6)
                    .map((cand) => (
                      <tr key={cand.employee_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 font-medium text-slate-900 dark:text-slate-200">
                          {cand.display_name}
                        </td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{cand.role}</td>
                        <td className="py-2.5 text-slate-800 dark:text-slate-300 font-semibold">{cand.overall_score}%</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">{cand.remaining_capacity}h avail</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {cand.exclusion_reason || 'Lower composite score or redundant skill profile.'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Apply Team Confirmation Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Confirm Project Team Staffing"
        description="Verify and commit assignments for manager review."
      >
        <div className="space-y-4 text-xs">
          {applyError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-300">
            You are about to assign the following{' '}
            <strong className="text-slate-900 dark:text-white">{recommendation?.selected_team.length} team members</strong>{' '}
            to initiative <strong className="text-indigo-600 dark:text-indigo-400">{selectedProject?.name}</strong>:
          </p>

          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            {recommendation?.selected_team.map((m) => (
              <div
                key={m.employee_id}
                className="flex items-center justify-between py-1.5 border-b border-slate-200/80 dark:border-slate-800/60 last:border-0"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{m.display_name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{m.role}</span>
                </div>
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                  {m.proposed_allocation} hrs / week
                </span>
              </div>
            ))}
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            * Note: In accordance with manager approval guidelines, active assignments will only be updated after this confirmation. Any previous assignments for this project will be cleanly updated with no duplicate allocation records.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyTeam}
              disabled={applying}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              {applying ? 'Applying Assignments...' : 'Confirm & Staff Team'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
