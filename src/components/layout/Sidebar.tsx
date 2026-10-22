import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Building,
  Home,
  Users,
  HardHat,
  BarChart3,
  Workflow,
  PlusCircle,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen = false,
  onClose,
}) => {
  const { currentRole, currentUser } = useAuth();

  // Navigation configurations based on role
  const getNavItems = () => {
    if (currentRole === 'resident') {
      return [
        { id: 'resident_flats', label: 'My Flats & Warranty', icon: Home },
        { id: 'resident_raise', label: 'Raise Complaint', icon: PlusCircle, badge: 'New' },
        { id: 'resident_complaints', label: 'My Complaints', icon: ClipboardList },
      ];
    }

    if (currentRole === 'contractor') {
      return [
        { id: 'contractor_jobs', label: 'My Assigned Jobs', icon: ClipboardList },
        { id: 'contractor_visits', label: 'Site Visits & Inspection', icon: Calendar },
        { id: 'contractor_quotations', label: 'My Quotations', icon: CheckSquare },
        { id: 'contractor_progress', label: 'Work Progress & Evidence', icon: Clock },
        { id: 'contractor_completed', label: 'Completed Jobs', icon: CheckCircle },
      ];
    }

    if (currentRole === 'receptionist') {
      return [
        { id: 'dashboard', label: 'Helpdesk Dashboard', icon: LayoutDashboard },
        { id: 'complaints', label: 'Complaints', icon: ClipboardList },
        { id: 'resident_raise', label: 'Register for Resident', icon: PlusCircle },
        { id: 'flats', label: 'Flats & Possession', icon: Home },
        { id: 'residents', label: 'Resident Directory', icon: Users },
      ];
    }

    // Default: builder_admin and super_admin
    return [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { id: 'complaints', label: 'Complaints Queue', icon: ClipboardList },
      { id: 'quotations', label: 'Quotation Approvals', icon: CheckSquare, badge: 'Threshold' },
      { id: 'projects', label: 'Projects & Towers', icon: Building },
      { id: 'flats', label: 'Flats & Possession Dates', icon: Home },
      { id: 'residents', label: 'Resident Flat Linking', icon: Users },
      { id: 'contractors', label: 'Contractor Management', icon: HardHat },
      { id: 'reports', label: 'Reports & CSV Export', icon: BarChart3 },
      { id: 'automation', label: 'Future n8n & WhatsApp Hub', icon: Workflow, badge: 'V2' },
    ];
  };

  const navItems = getNavItems();

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel (Slide-over drawer on mobile, static on desktop) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:w-64 lg:min-h-[calc(100vh-4rem)] lg:shadow-none
        `}
      >
        {/* Workspace Info & Mobile Close Button */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Active Workspace</div>
            <div className="mt-1 text-sm font-semibold text-white truncate">{currentUser.full_name}</div>
            <div className="text-xs text-indigo-400 capitalize flex items-center gap-1 font-medium mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
              <span className="truncate">{currentRole.replace(/_/g, ' ')} Portal</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2 shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 lg:py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1 shrink-0">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-slate-400 font-mono">1.0.0 (MVP)</span>
          </div>
          <div className="flex justify-between">
            <span>RLS Enforced</span>
            <span className="text-emerald-500 font-medium">Active</span>
          </div>
          <div className="flex justify-between">
            <span>Next Channel</span>
            <span className="text-indigo-400 font-medium">WhatsApp V2</span>
          </div>
        </div>
      </aside>
    </>
  );
};
