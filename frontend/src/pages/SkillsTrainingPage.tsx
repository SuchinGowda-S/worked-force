import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Search,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TrainingCourse, Skill } from '../types';
import { Badge } from '../components/Badge';

interface SkillsTrainingPageProps {
  refreshTrigger: number;
}

export const SkillsTrainingPage: React.FC<SkillsTrainingPageProps> = ({
  refreshTrigger,
}) => {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [gapData, setGapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<number | ''>('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, skillRes, gapRes] = await Promise.all([
          api.getTrainingCourses(skillFilter ? Number(skillFilter) : undefined),
          api.getSkills(),
          api.getSkillGaps(),
        ]);
        setCourses(courseRes);
        setSkillsList(skillRes);
        setGapData(gapRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [skillFilter, refreshTrigger]);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.skill_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || c.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Skill Gaps & Local Training Catalogue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Targeted curricula matched to current project shortfalls to systematically upskill engineering staff
          </p>
        </div>
      </div>

      {/* Project Skill Gaps Overview */}
      {gapData && gapData.projects && gapData.projects.length > 0 && (
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Unmet Competencies by Active & Upcoming Initiative
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Required proficiencies that are currently unmet by assigned team members
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapData.projects.map((proj: any) => (
              <div
                key={proj.project_id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{proj.project_name}</h3>
                  <Badge variant={proj.status === 'active' ? 'success' : 'primary'} size="sm">
                    {proj.status}
                  </Badge>
                </div>

                {proj.gaps.length === 0 ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All required competencies satisfied
                  </p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {proj.gaps.map((g: any, gIdx: number) => (
                      <div
                        key={gIdx}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{g.skill_name}</span>
                          {g.is_mandatory && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-500/30 uppercase">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Team: Lvl {g.achieved_proficiency} / Req: Lvl {g.required_proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search courses by title, topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Skill Filter */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value ? parseInt(e.target.value) : '')}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Topics</option>
            {skillsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Difficulty Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {(search || skillFilter !== '' || levelFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setSkillFilter('');
                setLevelFilter('');
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading course catalogue...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
          No training courses matched the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="primary" size="sm">
                    {course.skill_name}
                  </Badge>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> {course.estimated_hours}h
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium">{course.level} Level</span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{course.provider}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
