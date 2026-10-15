import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Plus,
  Calendar,
  Sparkles,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Project, Skill } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface ProjectsPageProps {
  onFindBestTeam: (projectId: number) => void;
  refreshTrigger: number;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onFindBestTeam,
  refreshTrigger,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-04-30');
  const [teamSize, setTeamSize] = useState(3);
  const [estimatedEffort, setEstimatedEffort] = useState(30.0);
  const [status, setStatus] = useState<'planning' | 'active' | 'completed'>('planning');
  const [requirements, setRequirements] = useState<
    { skill_id: number; required_proficiency: number; is_mandatory: boolean }[]
  >([]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [projRes, skillRes] = await Promise.all([
        api.getProjects(),
        api.getSkills(),
      ]);
      setProjects(projRes);
      setSkillsList(skillRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormError(null);
    setName('');
    setDescription('');
    setStartDate('2026-11-01');
    setEndDate('2027-04-30');
    setTeamSize(3);
    setEstimatedEffort(30.0);
    setStatus('planning');
    setRequirements([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormError(null);
    setName(proj.name);
    setDescription(proj.description || '');
    setStartDate(proj.start_date);
    setEndDate(proj.end_date);
    setTeamSize(proj.team_size);
    setEstimatedEffort(proj.estimated_effort_hours_per_week);
    setStatus(proj.status);
    setRequirements(
      proj.skill_requirements.map((r) => ({
        skill_id: r.skill_id,
        required_proficiency: r.required_proficiency,
        is_mandatory: r.is_mandatory,
      }))
    );
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project initiative name is required.');
      return;
    }

    if (startDate > endDate) {
      setFormError('Start date cannot be after the completion date.');
      return;
    }

    if (teamSize < 1) {
      setFormError('Team size must be at least 1 member.');
      return;
    }

    if (estimatedEffort <= 0) {
      setFormError('Estimated weekly effort must be greater than 0 hours.');
      return;
    }

    setFormError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        team_size: Number(teamSize),
        estimated_effort_hours_per_week: Number(estimatedEffort),
        status,
        requirements,
      };

      if (editingProject) {
        await api.updateProject(editingProject.id, payload);
      } else {
        await api.createProject(payload);
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Failed to save project. Please verify inputs.');
    }
  };

  const handleAddRequirement = (skillId: number) => {
    if (!requirements.some((r) => r.skill_id === skillId)) {
      setRequirements([
        ...requirements,
        { skill_id: skillId, required_proficiency: 3, is_mandatory: true },
      ]);
    }
  };

  const handleRemoveRequirement = (skillId: number) => {
    setRequirements(requirements.filter((r) => r.skill_id !== skillId));
  };

  const handleToggleMandatory = (skillId: number) => {
    setRequirements(
      requirements.map((r) =>
        r.skill_id === skillId ? { ...r, is_mandatory: !r.is_mandatory } : r
      )
    );
  };

  const handleProficiencyChange = (skillId: number, level: number) => {
    setRequirements(
      requirements.map((r) =>
        r.skill_id === skillId ? { ...r, required_proficiency: level } : r
      )
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Project Initiatives
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define initiatives, required competencies, team capacity, and run staffing simulations
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Initiative</span>
        </button>
      </div>

      {/* Projects Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading initiatives...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
          No projects found. Create one to begin team optimization.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const isStaffed = (proj.assigned_employees?.length || 0) >= proj.team_size;
            const effortPerMember = Math.round(
              proj.estimated_effort_hours_per_week / Math.max(1, proj.team_size)
            );

            return (
              <div
                key={proj.id}
                className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            proj.status === 'active'
                              ? 'success'
                              : proj.status === 'planning'
                              ? 'primary'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {proj.status.toUpperCase()}
                        </Badge>
                        <Badge variant={isStaffed ? 'success' : 'neutral'} size="sm">
                          {isStaffed ? 'Staffed' : 'Unstaffed'}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {proj.start_date} → {proj.end_date}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {proj.name}
                      </h2>
                    </div>

                    <button
                      onClick={() => handleOpenEditModal(proj)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 mb-4 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Team Size</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{proj.team_size} members</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Weekly Effort</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{proj.estimated_effort_hours_per_week}h total</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Effort / Person</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">~{effortPerMember}h / wk</p>
                    </div>
                  </div>

                  {/* Skill Requirements */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Required Skills & Competencies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.skill_requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border transition ${
                            req.is_mandatory
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-medium">{req.skill_name}</span>
                          <span className="text-[10px] opacity-80 font-bold">
                            Lvl {req.required_proficiency}
                          </span>
                          {req.is_mandatory && (
                            <span className="text-[9px] px-1 rounded bg-indigo-600 text-white font-bold uppercase">
                              Must
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Active Staffing */}
                  {proj.assigned_employees && proj.assigned_employees.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Current Staff ({proj.assigned_employees.length})</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active Assignments</span>
                      </p>
                      <div className="space-y-1.5">
                        {proj.assigned_employees.map((mem) => (
                          <div
                            key={mem.employee_id}
                            className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50"
                          >
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{mem.display_name} ({mem.role})</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{mem.allocated_hours} hrs/wk</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {proj.skill_requirements.length} skill requirements
                  </div>
                  <button
                    onClick={() => onFindBestTeam(proj.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/25"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Find Best Team</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? `Edit ${editingProject.name}` : 'Create New Initiative'}
        description="Specify requirements, timeframe, and skill proficiencies for team optimization."
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initiative Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Analytics Engine"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe initiative scope, objectives, and deliverables..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Desired Team Size (Persons)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Effort (Hours / Week)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Lifecycle Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'planning' | 'active' | 'completed')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="planning">Planning (Staffing in Progress)</option>
              <option value="active">Active (Underway)</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Skill Requirements Builder */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Required Skills & Thresholds
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddRequirement(parseInt(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-300"
              >
                <option value="">+ Add Skill Requirement</option>
                {skillsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {requirements.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No skills added. Add required skills to enable optimization.
                </p>
              ) : (
                requirements.map((req) => {
                  const skillObj = skillsList.find((s) => s.id === req.skill_id);
                  return (
                    <div
                      key={req.skill_id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {skillObj?.name || `Skill #${req.skill_id}`}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {req.is_mandatory ? 'Hard constraint (mandatory)' : 'Soft preference (optional)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Mandatory Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleMandatory(req.skill_id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                            req.is_mandatory
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {req.is_mandatory ? 'Must-Have' : 'Optional'}
                        </button>

                        {/* Proficiency Level */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleProficiencyChange(req.skill_id, lvl)}
                              className={`w-6 h-6 rounded-lg font-bold text-[10px] transition ${
                                req.required_proficiency >= lvl
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(req.skill_id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              {editingProject ? 'Save Changes' : 'Create Initiative'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
