import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Home,
  PlusCircle,
  Menu,
  Calendar,
} from 'lucide-react';

// Admin views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ComplaintList } from './components/admin/ComplaintList';
import { ComplaintDetail } from './components/admin/ComplaintDetail';
import { QuotationApprovals } from './components/admin/QuotationApprovals';
import { ProjectManager } from './components/admin/ProjectManager';
import { FlatManager } from './components/admin/FlatManager';
import { ResidentManager } from './components/admin/ResidentManager';
import { ContractorManager } from './components/admin/ContractorManager';
import { ReportsView } from './components/admin/ReportsView';

// Contractor view
import { ContractorDashboard } from './components/contractor/ContractorDashboard';

// Resident views
import { ResidentFlatsView } from './components/resident/ResidentFlatsView';
import { RaiseComplaintWizard } from './components/resident/RaiseComplaintWizard';
import { ResidentComplaintsList } from './components/resident/ResidentComplaintsList';
import { ResidentComplaintDetail } from './components/resident/ResidentComplaintDetail';

// Automation hub
import { IntegrationHub } from './components/automation/IntegrationHub';

const MainLayout: React.FC = () => {
  const { currentRole } = useAuth();

  // Tab navigation state
  const getDefaultTab = () => {
    if (currentRole === 'resident') return 'resident_flats';
    if (currentRole === 'contractor') return 'contractor_jobs';
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(getDefaultTab());
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [preselectedFlatId, setPreselectedFlatId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync tab if user switches role via persona bar
  React.useEffect(() => {
    setSelectedComplaintId(null);
    setCurrentTab(getDefaultTab());
    setIsMobileMenuOpen(false);
  }, [currentRole]);

  // Handle navigation from dashboard cards or lists
  const handleNavigateToTab = (tab: string, complaintId?: string) => {
    if (complaintId) {
      setSelectedComplaintId(complaintId);
    } else {
      setSelectedComplaintId(null);
    }
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    // 1. Resident Portal Views
    if (currentRole === 'resident') {
      if (selectedComplaintId) {
        return (
          <ResidentComplaintDetail
            complaintId={selectedComplaintId}
            onBack={() => setSelectedComplaintId(null)}
          />
        );
      }

      if (currentTab === 'resident_raise') {
        return (
          <RaiseComplaintWizard
            preselectedFlatId={preselectedFlatId}
            onSuccess={complaintId => {
              setSelectedComplaintId(complaintId);
              setCurrentTab('resident_complaints');
            }}
            onCancel={() => setCurrentTab('resident_flats')}
          />
        );
      }

      if (currentTab === 'resident_complaints') {
        return (
          <ResidentComplaintsList
            onSelectComplaint={comp => setSelectedComplaintId(comp.id)}
            onRaiseNew={() => {
              setPreselectedFlatId(undefined);
              setCurrentTab('resident_raise');
            }}
          />
        );
      }

      // Default: resident_flats
      return (
        <ResidentFlatsView
          onRaiseComplaint={flatId => {
            setPreselectedFlatId(flatId);
            setCurrentTab('resident_raise');
          }}
        />
      );
    }

    // 2. Contractor Portal View
    if (currentRole === 'contractor') {
      return <ContractorDashboard />;
    }

    // 3. Admin & Receptionist Views
    if (selectedComplaintId && currentTab === 'complaints') {
      return (
        <ComplaintDetail
          complaintId={selectedComplaintId}
          onBack={() => setSelectedComplaintId(null)}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboard onNavigateToTab={handleNavigateToTab} />;
      case 'complaints':
        return (
          <ComplaintList
            onSelectComplaint={comp => setSelectedComplaintId(comp.id)}
            onOpenCreateModal={() => setCurrentTab('resident_raise')}
          />
        );
      case 'quotations':
        return (
          <QuotationApprovals
            onViewComplaint={comp => {
              setSelectedComplaintId(comp.id);
              setCurrentTab('complaints');
            }}
          />
        );
      case 'projects':
        return <ProjectManager />;
      case 'flats':
        return <FlatManager />;
      case 'residents':
        return <ResidentManager />;
      case 'contractors':
        return <ContractorManager />;
      case 'reports':
        return <ReportsView />;
      case 'automation':
        return <IntegrationHub />;
      case 'resident_raise':
        return (
          <RaiseComplaintWizard
            onSuccess={complaintId => {
              setSelectedComplaintId(complaintId);
              setCurrentTab('complaints');
            }}
            onCancel={() => setCurrentTab('complaints')}
          />
        );
      default:
        return <AdminDashboard onNavigateToTab={handleNavigateToTab} />;
    }
  };

  // Get primary mobile bottom nav buttons based on user persona
  const renderMobileBottomNav = () => {
    if (currentRole === 'resident') {
      return (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around h-16 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
          aria-label="Mobile navigation bar"
        >
          <button
            onClick={() => handleNavigateToTab('resident_flats')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              currentTab === 'resident_flats' && !selectedComplaintId ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>My Flats</span>
          </button>

          <button
            onClick={() => handleNavigateToTab('resident_raise')}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-indigo-600 transition-transform active:scale-95"
          >
            <div className="w-10 h-10 -mt-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="mt-0.5">Raise</span>
          </button>

          <button
            onClick={() => handleNavigateToTab('resident_complaints')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              currentTab === 'resident_complaints' || selectedComplaintId ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>Requests</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-slate-500 transition-colors"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>Menu</span>
          </button>
        </nav>
      );
    }

    if (currentRole === 'contractor') {
      return (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around h-16 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
          aria-label="Mobile navigation bar"
        >
          <button
            onClick={() => handleNavigateToTab('contractor_jobs')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              currentTab === 'contractor_jobs' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>Jobs</span>
          </button>

          <button
            onClick={() => handleNavigateToTab('contractor_visits')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              currentTab === 'contractor_visits' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span>Visits</span>
          </button>

          <button
            onClick={() => handleNavigateToTab('contractor_quotations')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              currentTab === 'contractor_quotations' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span>Quotes</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-slate-500 transition-colors"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>Menu</span>
          </button>
        </nav>
      );
    }

    // Default for Admin and Receptionist
    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around h-16 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        aria-label="Mobile navigation bar"
      >
        <button
          onClick={() => handleNavigateToTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
            currentTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleNavigateToTab('complaints')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
            currentTab === 'complaints' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span>Complaints</span>
        </button>

        <button
          onClick={() =>
            currentRole === 'receptionist'
              ? handleNavigateToTab('resident_raise')
              : handleNavigateToTab('quotations')
          }
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
            currentTab === 'quotations' || currentTab === 'resident_raise'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          {currentRole === 'receptionist' ? (
            <>
              <PlusCircle className="w-5 h-5 mb-0.5" />
              <span>Register</span>
            </>
          ) : (
            <>
              <CheckSquare className="w-5 h-5 mb-0.5" />
              <span>Approvals</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-slate-500 transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          currentTab={currentTab}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onSelectTab={tab => {
            setSelectedComplaintId(null);
            setCurrentTab(tab);
          }}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
          {renderContent()}
        </main>
      </div>
      {renderMobileBottomNav()}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
