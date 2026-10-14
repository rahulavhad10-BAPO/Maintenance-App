import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Project, Building } from '../../types/database';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  PlusCircle,
  Edit2,
  Calendar,
  Layers,
  Settings,
  CheckCircle2,
  X,
} from 'lucide-react';

export const ProjectManager: React.FC = () => {
  const { currentOrg } = useAuth();
  const { showToast } = useNotifications();

  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [durationMonths, setDurationMonths] = useState(24);
  const [threshold, setThreshold] = useState(5000);
  const [allRequireApproval, setAllRequireApproval] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projs, bldgs] = await Promise.all([
        api.getProjects(currentOrg.id),
        api.getBuildings(),
      ]);
      setProjects(projs);
      setBuildings(bldgs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg.id]);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setCode('');
    setCity('');
    setCurrency('INR');
    setTimezone('Asia/Kolkata');
    setDurationMonths(24);
    setThreshold(5000);
    setAllRequireApproval(false);
    setShowModal(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setCode(p.code);
    setCity(p.city || '');
    setCurrency(p.default_currency);
    setTimezone(p.time_zone);
    setDurationMonths(p.free_maintenance_duration_months);
    setThreshold(p.quotation_approval_threshold);
    setAllRequireApproval(p.all_quotations_require_approval);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      showToast('warning', 'Required Fields', 'Please specify project name and unique code.');
      return;
    }

    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, {
          name,
          code,
          city,
          default_currency: currency,
          time_zone: timezone,
          free_maintenance_duration_months: Number(durationMonths),
          quotation_approval_threshold: Number(threshold),
          all_quotations_require_approval: allRequireApproval,
        });
        showToast('success', 'Project Updated', 'Project configuration and associated flat warranties updated.');
      } else {
        await api.createProject({
          organization_id: currentOrg.id,
          name,
          code,
          city,
          country: 'India',
          default_currency: currency,
          time_zone: timezone,
          free_maintenance_duration_months: Number(durationMonths),
          quotation_approval_threshold: Number(threshold),
          all_quotations_require_approval: allRequireApproval,
          covered_categories: ['Plumbing', 'Electrical', 'Civil work and cracks', 'Waterproofing and leakage'],
          excluded_categories: ['Structural modifications'],
          is_active: true,
        });
        showToast('success', 'Project Created', 'New residential project added successfully.');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Projects, Warranty Periods & Approval Thresholds
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure free-maintenance durations (months) and quotation financial approval thresholds per development.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(proj => {
          const projectBuildings = buildings.filter(b => b.project_id === proj.id);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {proj.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{proj.name}</h3>
                  <p className="text-xs text-slate-500">{proj.city || 'Gurugram'}, {proj.country}</p>
                </div>
                <button
                  onClick={() => openEditModal(proj)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Configure project settings"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Maintenance Period & Threshold Config Indicators */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Free Maintenance Duration:</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {proj.free_maintenance_duration_months} Months
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Calculated from each flat's possession date
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Quotation Approval Threshold:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {proj.quotation_approval_threshold.toLocaleString()} {proj.default_currency}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {proj.all_quotations_require_approval
                      ? '⚠️ All quotations require approval'
                      : 'Approval strictly required if > threshold'}
                  </span>
                </div>
              </div>

              {/* Towers / Buildings */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Constructed Towers / Blocks ({projectBuildings.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {projectBuildings.map(bldg => (
                    <span
                      key={bldg.id}
                      className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200"
                    >
                      {bldg.name} ({bldg.total_floors} fl)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create/Edit Project */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProject ? 'Configure Project Warranty & Rules' : 'Create New Project'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Project Name *:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Emerald Heights"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Project Code *:</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. EH-01"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Gurugram"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Currency:</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Timezone:</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <span className="font-bold text-indigo-900 block text-xs">
                  Maintenance & Quotation Governance
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Free Maintenance Period (Months):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={durationMonths}
                      onChange={e => setDurationMonths(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Recalculates all flats' end dates on update.
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Quotation Approval Threshold:
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={threshold}
                      onChange={e => setThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Amounts strictly above this require admin approval.
                    </span>
                  </div>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allRequireApproval}
                    onChange={e => setAllRequireApproval(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-800 font-medium">
                    Strict Policy: All quotations require approval regardless of threshold
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
