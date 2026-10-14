import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, Project, Contractor } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  ClipboardList,
  AlertCircle,
  Clock,
  HardHat,
  FileCheck,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToTab: (tab: string, complaintId?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToTab }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allComplaints, allProjects, allContractors] = await Promise.all([
        api.getComplaints(selectedProjectId !== 'all' ? { projectId: selectedProjectId } : undefined),
        api.getProjects(),
        api.getContractors(),
      ]);
      setComplaints(allComplaints);
      setProjects(allProjects);
      setContractors(allContractors);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation from real data
  const total = complaints.length;
  const newComplaints = complaints.filter(c => c.status === 'new').length;
  const awaitingAssignment = complaints.filter(c => c.status === 'awaiting_assignment').length;
  const visitsPending = complaints.filter(c => c.status === 'assigned' || c.status === 'visit_scheduled').length;
  const awaitingApproval = complaints.filter(c => c.status === 'awaiting_approval').length;
  const authorizedToProceed = complaints.filter(c => c.status === 'authorized_to_proceed').length;
  const workInProgress = complaints.filter(c => c.status === 'work_in_progress').length;
  const completed = complaints.filter(c => c.status === 'closed' || c.status === 'work_completed').length;
  
  // Overdue: open for > 5 days and not closed
  const overdue = complaints.filter(c => {
    if (c.status === 'closed' || c.status === 'out_of_scope') return false;
    const daysOpen = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24);
    return daysOpen >= 5;
  }).length;

  // Breakdown by Category
  const categoryCounts: Record<string, number> = {};
  complaints.forEach(c => {
    const catName = c.category?.name || 'Uncategorized';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  });

  // Contractor Workload
  const contractorWorkload: Record<string, number> = {};
  complaints.forEach(c => {
    if (c.assigned_contractor_id) {
      const cnt = contractors.find(k => k.id === c.assigned_contractor_id);
      const name = cnt ? cnt.company_name : 'Assigned Vendor';
      contractorWorkload[name] = (contractorWorkload[name] || 0) + 1;
    }
  });

  // Urgent pending approvals
  const pendingApprovalsList = complaints.filter(c => c.status === 'awaiting_approval');

  return (
    <div className="space-y-6">
      {/* Page Title & Project Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Maintenance Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of post-possession tickets, contractor accountability, and warranty coverage
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label htmlFor="proj-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Project Filter:
          </label>
          <select
            id="proj-select"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 9 Key KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Complaints</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="ml-2 text-[11px] text-slate-400">lifetime</span>
          </div>
        </div>

        {/* Awaiting Assignment */}
        <div
          onClick={() => onNavigateToTab('complaints')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Awaiting Assignment</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-amber-600">{awaitingAssignment}</span>
            <span className="ml-2 text-[11px] text-amber-600/70 font-medium">needs vendor</span>
          </div>
        </div>

        {/* Visits Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Visits Pending</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-blue-600">{visitsPending}</span>
            <span className="ml-2 text-[11px] text-blue-600/70">scheduled/inspect</span>
          </div>
        </div>

        {/* Quotations Awaiting Approval */}
        <div
          onClick={() => onNavigateToTab('quotations')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs hover:border-rose-400 transition-colors cursor-pointer bg-rose-50/20"
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Quotations &gt; Threshold</span>
            <FileCheck className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-rose-600">{awaitingApproval}</span>
            <span className="ml-2 text-[11px] text-rose-600/80 font-medium">pending sign-off</span>
          </div>
        </div>

        {/* Work In Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Work In Progress</span>
            <HardHat className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-emerald-600">{workInProgress}</span>
            <span className="ml-2 text-[11px] text-emerald-600/70">active repairs</span>
          </div>
        </div>

        {/* Authorized to Proceed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-teal-700 text-xs font-medium">
            <span>Authorized to Start</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-teal-600">{authorizedToProceed}</span>
            <span className="ml-2 text-[11px] text-slate-400">ready</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Overdue (&gt; 5 Days)</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-rose-600">{overdue}</span>
            <span className="ml-2 text-[11px] text-rose-500/80">needs urgency</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Completed & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-slate-800">{completed}</span>
            <span className="ml-2 text-[11px] text-emerald-600 font-medium">
              {total > 0 ? Math.round((completed / total) * 100) : 0}% rate
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Quotation Approvals Section */}
      {pendingApprovalsList.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
              <h2 className="font-bold text-amber-900 text-sm">
                Quotations Exceeding Approval Threshold ({pendingApprovalsList.length} requiring sign-off)
              </h2>
            </div>
            <button
              onClick={() => onNavigateToTab('quotations')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              Go to Approval Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovalsList.map(comp => {
              const quo = comp.quotations?.[0];
              return (
                <div
                  key={comp.id}
                  onClick={() => onNavigateToTab('complaints', comp.id)}
                  className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs hover:shadow-sm cursor-pointer transition-all flex justify-between items-start"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {comp.complaint_reference}
                      </span>
                      <StatusBadge priority={comp.priority} />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-xs mt-1 line-clamp-1">{comp.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {comp.flat?.flat_number} • {comp.project?.name}
                    </p>
                  </div>
                  {quo && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-700">
                        {quo.total_amount.toLocaleString()} {quo.currency}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Threshold: {quo.threshold_applied?.toLocaleString()} {quo.currency}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Breakdowns: Category Distribution & Contractor Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Complaints by Maintenance Category
            </h2>
            <span className="text-xs text-slate-400">Total: {total}</span>
          </div>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{cat}</span>
                    <span className="text-slate-500">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contractor Workload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HardHat className="w-4 h-4 text-emerald-600" /> Contractor Active Job Allocation
            </h2>
            <span className="text-xs text-slate-400">Real Workload</span>
          </div>
          <div className="space-y-3">
            {Object.keys(contractorWorkload).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active contractor assignments yet.</p>
            ) : (
              Object.entries(contractorWorkload).map(([cntName, count]) => {
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cntName}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>{cntName}</span>
                      <span className="text-emerald-700 font-semibold">{count} jobs</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percent * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
