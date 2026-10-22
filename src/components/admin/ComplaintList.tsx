import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, Project, MaintenanceCategory, Contractor } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  Filter,
  Eye,
  PlusCircle,
  Building,
  Home,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ComplaintListProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenCreateModal?: () => void;
}

export const ComplaintList: React.FC<ComplaintListProps> = ({
  onSelectComplaint,
  onOpenCreateModal,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<MaintenanceCategory[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCoverage, setSelectedCoverage] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allComplaints, allProjects, allCats, allContractors] = await Promise.all([
        api.getComplaints(),
        api.getProjects(),
        api.getCategories(),
        api.getContractors(),
      ]);
      setComplaints(allComplaints);
      setProjects(allProjects);
      setCategories(allCats);
      setContractors(allContractors);
    } catch (e) {
      console.error('Error fetching complaints list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter application
  const filtered = complaints.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = c.complaint_reference.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchFlat = c.flat?.flat_number.toLowerCase().includes(q);
      const matchResident = c.resident?.full_name.toLowerCase().includes(q);
      if (!matchRef && !matchTitle && !matchFlat && !matchResident) return false;
    }
    if (selectedProject !== 'all' && c.project_id !== selectedProject) return false;
    if (selectedCategory !== 'all' && c.category_id !== selectedCategory) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (selectedCoverage !== 'all' && c.coverage_result !== selectedCoverage) return false;
    if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedProject('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedCoverage('all');
    setSelectedPriority('all');
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Complaints Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete lifecycle management from intake and contractor dispatch to sign-off
          </p>
        </div>
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Complaint</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by reference (e.g. CMP-2026-0001), flat number, resident name, or issue keywords..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Project */}
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="awaiting_assignment">Awaiting Assignment</option>
            <option value="assigned">Assigned</option>
            <option value="visit_scheduled">Visit Scheduled</option>
            <option value="awaiting_quotation">Awaiting Quotation</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="authorized_to_proceed">Authorized to Proceed</option>
            <option value="work_in_progress">Work In Progress</option>
            <option value="awaiting_resident_confirmation">Awaiting Resident Confirmation</option>
            <option value="closed">Closed</option>
          </select>

          {/* Coverage Result */}
          <select
            value={selectedCoverage}
            onChange={e => setSelectedCoverage(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Coverage</option>
            <option value="within_coverage">Within Coverage</option>
            <option value="outside_coverage">Outside Coverage</option>
            <option value="coverage_review_required">Review Required</option>
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Active filter count & clear */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filtered.length}</strong> of{' '}
            {complaints.length} complaints
          </span>
          <button
            onClick={resetFilters}
            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Complaints Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Cards View (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No complaints match the specified filters.
            </div>
          ) : (
            filtered.map(comp => (
              <div
                key={comp.id}
                onClick={() => onSelectComplaint(comp)}
                className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {comp.complaint_reference}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <StatusBadge priority={comp.priority} />
                    <StatusBadge status={comp.status} />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{comp.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700">Unit {comp.flat?.flat_number || 'N/A'}</span>
                    <span>•</span>
                    <span>{comp.building?.name}</span>
                    <span>•</span>
                    <span>{comp.category?.name}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                  <div>
                    <StatusBadge coverage={comp.coverage_result} />
                  </div>
                  <div className="text-[11px] text-right">
                    {comp.contractor ? (
                      <span className="text-slate-700 font-medium">{comp.contractor.company_name}</span>
                    ) : (
                      <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (Hidden on screens < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref #</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Title & Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Warranty Assessment</th>
                <th className="py-3.5 px-4">Contractor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No complaints match the specified filters.
                  </td>
                </tr>
              ) : (
                filtered.map(comp => (
                  <tr
                    key={comp.id}
                    onClick={() => onSelectComplaint(comp)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* Ref */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {comp.complaint_reference}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{comp.flat?.flat_number || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">
                        {comp.building?.name} • {comp.project?.code}
                      </div>
                    </td>

                    {/* Title & Category */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={comp.title}>
                        {comp.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>{comp.category?.name}</span>
                        {comp.subcategory && <span>• {comp.subcategory}</span>}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <StatusBadge priority={comp.priority} />
                    </td>

                    {/* Warranty Assessment */}
                    <td className="py-3.5 px-4">
                      <StatusBadge coverage={comp.coverage_result} />
                      {comp.coverage_override_reason && (
                        <span className="block text-[10px] text-amber-700 italic mt-0.5" title={comp.coverage_override_reason}>
                          (Overridden)
                        </span>
                      )}
                    </td>

                    {/* Contractor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {comp.contractor ? (
                        <div>
                          <div className="font-medium text-slate-800">{comp.contractor.company_name}</div>
                          <div className="text-[10px] text-slate-400">{comp.contractor.contact_name}</div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={comp.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectComplaint(comp);
                        }}
                        className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
