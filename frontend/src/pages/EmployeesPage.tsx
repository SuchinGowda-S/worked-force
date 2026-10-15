import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Employee, Skill } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface EmployeesPageProps {
  refreshTrigger: number;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ refreshTrigger }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [workloadFilter, setWorkloadFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [experienceYears, setExperienceYears] = useState(3.0);
  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState(40.0);
  const [availabilityPercent, setAvailabilityPercent] = useState(100.0);
  const [active, setActive] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<{ skill_id: number; proficiency_level: number }[]>([]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empRes, skillRes] = await Promise.all([
        api.getEmployees({
          search: search || undefined,
          skill: skillFilter || undefined,
          workload: workloadFilter || undefined,
        }),
        api.getSkills(),
      ]);
      setEmployees(empRes);
      setSkillsList(skillRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, skillFilter, workloadFilter, refreshTrigger]);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormError(null);
    setDisplayName('');
    setRole('');
    setDepartment('Engineering');
    setExperienceYears(3.0);
    setWeeklyCapacityHours(40.0);
    setAvailabilityPercent(100.0);
    setActive(true);
    setSelectedSkills([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormError(null);
    setDisplayName(emp.display_name);
    setRole(emp.role);
    setDepartment(emp.department);
    setExperienceYears(emp.experience_years);
    setWeeklyCapacityHours(emp.weekly_capacity_hours);
    setAvailabilityPercent(emp.availability_percent);
    setActive(emp.active);
    setSelectedSkills(
      emp.skills.map((s) => ({
        skill_id: s.skill_id,
        proficiency_level: s.proficiency_level,
      }))
    );
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFormError('Employee full name or identifier is required.');
      return;
    }
    if (!role.trim()) {
      setFormError('Role or job title is required.');
      return;
    }
    if (Number(weeklyCapacityHours) <= 0) {
      setFormError('Weekly capacity hours must be greater than 0.');
      return;
    }

    setFormError(null);
    try {
      const payload = {
        display_name: displayName.trim(),
        role: role.trim(),
        department,
        experience_years: Number(experienceYears),
        weekly_capacity_hours: Number(weeklyCapacityHours),
        availability_percent: Number(availabilityPercent),
        active,
        skills: selectedSkills,
      };

      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, payload);
      } else {
        await api.createEmployee(payload);
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Failed to save employee. Please verify inputs.');
    }
  };

  const handleDeleteEmployee = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove synthetic employee "${name}"?`)) {
      try {
        await api.deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddSkillToForm = (skillId: number) => {
    if (!selectedSkills.some((s) => s.skill_id === skillId)) {
      setSelectedSkills([...selectedSkills, { skill_id: skillId, proficiency_level: 3 }]);
    }
  };

  const handleRemoveSkillFromForm = (skillId: number) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skill_id !== skillId));
  };

  const handleSkillProficiencyChange = (skillId: number, level: number) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.skill_id === skillId ? { ...s, proficiency_level: level } : s))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Workforce Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synthetic demo talent pool with verified skills, real-time weekly capacity, and utilization tracking
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, role, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Skill Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Skills</option>
              {skillsList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workload Status Filter */}
          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Workloads</option>
            <option value="overloaded">Overloaded (&gt; 100%)</option>
            <option value="optimal">Optimal (70–100%)</option>
            <option value="underutilized">Underutilized (&lt; 70%)</option>
          </select>

          {(search || skillFilter || workloadFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setSkillFilter('');
                setWorkloadFilter('');
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading directory...</div>
      ) : employees.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          No employees match the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => {
            const util = emp.current_utilization_percent || 0;
            const isOverloaded = util > 100;
            const isUnder = util < 70;

            return (
              <div
                key={emp.id}
                className="rounded-2xl p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-700 dark:text-white text-sm shadow-sm">
                        {emp.display_name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {emp.display_name}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{emp.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.display_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {emp.department}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {emp.experience_years} yrs exp
                    </span>
                    {!emp.active && (
                      <Badge variant="neutral" size="sm">Inactive</Badge>
                    )}
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Current Workload:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {emp.active_assignment_hours || 0} / {emp.weekly_capacity_hours} hrs ({util}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverloaded
                            ? 'bg-rose-500'
                            : isUnder
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        variant={
                          isOverloaded
                            ? 'danger'
                            : isUnder
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {isOverloaded
                          ? 'Overloaded (>100%)'
                          : isUnder
                          ? 'Underutilized (<70%)'
                          : 'Optimal (70–100%)'}
                      </Badge>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Remaining: {Math.max(0, emp.weekly_capacity_hours - (emp.active_assignment_hours || 0))}h
                      </span>
                    </div>
                  </div>

                  {/* Skills Chips with Proficiency Dots */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Skills & Proficiency
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {emp.skills.map((s, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5"
                        >
                          <span className="font-medium">{s.skill_name}</span>
                          <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                            Lvl {s.proficiency_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? `Edit ${editingEmployee.display_name}` : 'Add New Employee'}
        description="Configure synthetic employee profile, weekly capacity, and skill proficiencies."
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name / Identifier *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Title *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Engineering">Engineering</option>
                <option value="Core AI">Core AI</option>
                <option value="Platform Engineering">Platform Engineering</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Experience Engineering">Experience Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weekly Capacity (Hours)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={weeklyCapacityHours}
                onChange={(e) => setWeeklyCapacityHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Active Employee</span>
              </label>
            </div>
          </div>

          {/* Skill Selector */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Skills & Proficiency (1: Novice, 5: Expert)
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSkillToForm(parseInt(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-300"
              >
                <option value="">+ Add Skill</option>
                {skillsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedSkills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No skills selected yet.</p>
              ) : (
                selectedSkills.map((item) => {
                  const skillObj = skillsList.find((s) => s.id === item.skill_id);
                  return (
                    <div
                      key={item.skill_id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {skillObj?.name || `Skill #${item.skill_id}`}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              type="button"
                              key={level}
                              onClick={() => handleSkillProficiencyChange(item.skill_id, level)}
                              className={`w-6 h-6 rounded-lg font-bold text-[10px] transition ${
                                item.proficiency_level >= level
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillFromForm(item.skill_id)}
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
              {editingEmployee ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
