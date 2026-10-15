import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ConfirmDialog } from './components/ConfirmDialog';
import { type NavTab } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { WorkloadPage } from './pages/WorkloadPage';
import { SkillsTrainingPage } from './pages/SkillsTrainingPage';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './lib/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [apiHealthy, setApiHealthy] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Sidebar Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Reset Demo Data State
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Periodic health check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.checkHealth();
        setApiHealthy(true);
      } catch (err) {
        setApiHealthy(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNavigateWithProject = (tab: NavTab, projectId?: number) => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await api.seedDatabase();
      setResetSuccess(true);
      setShowResetConfirm(false);
      handleRefreshData();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to reset demo data', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenResetDialog={() => setShowResetConfirm(true)}
          isResetting={isResetting}
          resetSuccess={resetSuccess}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Top Header */}
          <Header
            currentTab={currentTab}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            apiHealthy={apiHealthy}
          />

          {/* Page View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigate={handleNavigateWithProject}
                refreshTrigger={refreshTrigger}
              />
            )}
            {currentTab === 'employees' && (
              <EmployeesPage refreshTrigger={refreshTrigger} />
            )}
            {currentTab === 'projects' && (
              <ProjectsPage
                onFindBestTeam={(projId) => handleNavigateWithProject('recommendations', projId)}
                refreshTrigger={refreshTrigger}
              />
            )}
            {currentTab === 'recommendations' && (
              <RecommendationsPage
                initialProjectId={selectedProjectId}
                onNavigateToTraining={() => setCurrentTab('training')}
                onRefreshData={handleRefreshData}
                refreshTrigger={refreshTrigger}
              />
            )}
            {currentTab === 'workload' && (
              <WorkloadPage
                onRefreshData={handleRefreshData}
                refreshTrigger={refreshTrigger}
              />
            )}
            {currentTab === 'training' && (
              <SkillsTrainingPage refreshTrigger={refreshTrigger} />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 WorkForceIQ — Enterprise Workforce Planning & Decision Support.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Deterministic Decision Support: 50% Skill Fit, 20% Experience, 20% Availability, 10% Workload.
              </p>
            </div>
          </footer>
        </div>

        {/* Reset Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={handleConfirmReset}
          title="Reset Demo Data to Benchmark"
          description="Are you sure you want to reset all employees, initiatives, and assignments back to the initial hackathon demo dataset? Any custom additions will be reverted."
          confirmLabel="Reset Everything"
          variant="warning"
          isLoading={isResetting}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
