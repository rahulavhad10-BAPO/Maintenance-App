import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

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

  // Sync tab if user switches role via persona bar
  React.useEffect(() => {
    setSelectedComplaintId(null);
    setCurrentTab(getDefaultTab());
  }, [currentRole]);

  // Handle navigation from dashboard cards or lists
  const handleNavigateToTab = (tab: string, complaintId?: string) => {
    if (complaintId) {
      setSelectedComplaintId(complaintId);
    } else {
      setSelectedComplaintId(null);
    }
    setCurrentTab(tab);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={tab => {
          setSelectedComplaintId(null);
          setCurrentTab(tab);
        }} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>
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
