import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, Project, Contractor } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  HardHat,
  FileCheck,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allComplaints, allProjs, allCnts] = await Promise.all([
        api.getComplaints(),
        api.getProjects(),
        api.getContractors(),
      ]);
      setComplaints(allComplaints);
      setProjects(allProjs);
      setContractors(allCnts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Financial calculations
  let totalQuoted = 0;
  let totalApproved = 0;
  let totalUnderThreshold = 0;
  let totalRejected = 0;

  complaints.forEach(c => {
    if (c.quotations) {
      c.quotations.forEach(q => {
        totalQuoted += Number(q.total_amount || 0);
        if (q.status === 'approved') {
          totalApproved += Number(q.total_amount || 0);
        } else if (q.status === 'approved_under_threshold') {
          totalUnderThreshold += Number(q.total_amount || 0);
        } else if (q.status === 'rejected') {
          totalRejected += Number(q.total_amount || 0);
        }
      });
    }
  });

  const reopenedComplaints = complaints.filter(c => c.reopened_at);
  const coverageExceptions = complaints.filter(c => c.coverage_override_reason);

  // CSV Export
  const exportComplaintsCSV = () => {
    const headers = [
      'Reference',
      'Date',
      'Project',
      'Building',
      'Flat',
      'Resident',
      'Category',
      'Priority',
      'Status',
      'Coverage Result',
      'Contractor',
    ];

    const rows = complaints.map(c => [
      c.complaint_reference,
      c.created_at.split('T')[0],
      `"${c.project?.name || ''}"`,
      `"${c.building?.name || ''}"`,
      c.flat?.flat_number || '',
      `"${c.resident?.full_name || ''}"`,
      `"${c.category?.name || ''}"`,
      c.priority,
      c.status,
      c.coverage_result,
      `"${c.contractor?.company_name || 'Unassigned'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maintenance_Complaints_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Operational Analytics & Financial Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs, expenditure reconciliation, coverage exception tracking, and CSV data export.
          </p>
        </div>

        <button
          onClick={exportComplaintsCSV}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Quoted Pipeline</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            ₹ {totalQuoted.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Sum of all contractor estimates</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-800 font-semibold block">Approved (&gt; Threshold)</span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">
            ₹ {totalApproved.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Explicit manager sign-offs</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-xs bg-teal-50/20">
          <span className="text-xs text-teal-800 font-semibold block">Approved Under Threshold</span>
          <span className="text-xl font-bold text-teal-700 mt-1 block">
            ₹ {totalUnderThreshold.toLocaleString()}
          </span>
          <span className="text-[10px] text-teal-600 mt-0.5 block">Expedited within threshold</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-rose-700 font-semibold block">Rejected Scope</span>
          <span className="text-xl font-bold text-rose-600 mt-1 block">
            ₹ {totalRejected.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Cost savings through audit</span>
        </div>
      </div>

      {/* Reopened Complaints & Coverage Exceptions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Exceptions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Warranty Exceptions & Overrides ({coverageExceptions.length})
            </h2>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Goodwill Approvals
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Complaint</th>
                  <th className="py-2.5 px-3">Flat</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Recorded Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coverageExceptions.map(c => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                      {c.complaint_reference}
                    </td>
                    <td className="py-2.5 px-3">{c.flat?.flat_number}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge coverage={c.coverage_result} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 italic text-[11px]">
                      "{c.coverage_override_reason}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reopened Complaints */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Reopened & Unresolved Tickets ({reopenedComplaints.length})
            </h2>
            <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Quality Inspection
            </span>
          </div>

          {reopenedComplaints.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No tickets currently marked reopened.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Complaint</th>
                    <th className="py-2.5 px-3">Resident</th>
                    <th className="py-2.5 px-3">Reopen Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reopenedComplaints.map(c => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                        {c.complaint_reference}
                      </td>
                      <td className="py-2.5 px-3">{c.resident?.full_name}</td>
                      <td className="py-2.5 px-3 text-rose-700 font-medium text-[11px]">
                        {c.reopen_reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
