import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Flat, Building, Project } from '../../types/database';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { calculateMaintenanceEndDate } from '../../services/mockStorage';
import {
  Home,
  PlusCircle,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const FlatManager: React.FC = () => {
  const { currentOrg } = useAuth();
  const { showToast } = useNotifications();

  const [flats, setFlats] = useState<Flat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Flat Modal
  const [showModal, setShowModal] = useState(false);
  const [flatNumber, setFlatNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState(1);
  const [projectId, setProjectId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [possessionDate, setPossessionDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allFlats, allProjs, allBldgs] = await Promise.all([
        api.getFlats(),
        api.getProjects(currentOrg.id),
        api.getBuildings(),
      ]);
      setFlats(allFlats);
      setProjects(allProjs);
      setBuildings(allBldgs);
      if (allProjs.length > 0 && !projectId) {
        setProjectId(allProjs[0].id);
        const pBldgs = allBldgs.filter(b => b.project_id === allProjs[0].id);
        if (pBldgs.length > 0) setBuildingId(pBldgs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg.id]);

  const handleProjectSelect = (pId: string) => {
    setProjectId(pId);
    const pBldgs = buildings.filter(b => b.project_id === pId);
    if (pBldgs.length > 0) setBuildingId(pBldgs[0].id);
    else setBuildingId('');
  };

  const selectedProj = projects.find(p => p.id === projectId);
  const projectedDuration = selectedProj?.free_maintenance_duration_months ?? 24;
  const previewEndDate = calculateMaintenanceEndDate(possessionDate, projectedDuration);

  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber.trim() || !projectId || !buildingId || !possessionDate) {
      showToast('warning', 'Missing Fields', 'Please complete all flat details.');
      return;
    }

    try {
      await api.createFlat({
        organization_id: currentOrg.id,
        project_id: projectId,
        building_id: buildingId,
        flat_number: flatNumber.trim(),
        floor_number: Number(floorNumber),
        possession_date: possessionDate,
      });
      showToast('success', 'Flat Created', `Unit ${flatNumber} added. Warranty calculated to: ${previewEndDate}`);
      setShowModal(false);
      setFlatNumber('');
      loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const filteredFlats = flats.filter(f => (selectedProjectId === 'all' ? true : f.project_id === selectedProjectId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-600" /> Flats & Possession Handover Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual handover records with automated maintenance end dates based on project policy.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Flat</span>
          </button>
        </div>
      </div>

      {/* Flats Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Card View (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredFlats.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No flats registered yet for this project.
            </div>
          ) : (
            filteredFlats.map(flat => {
              const isExpired = new Date(flat.calculated_maintenance_end_date) < new Date();
              const daysRemaining = Math.round(
                (new Date(flat.calculated_maintenance_end_date).getTime() - Date.now()) / (1000 * 3600 * 24)
              );

              return (
                <div key={flat.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-base">Unit {flat.flat_number}</span>
                      <span className="text-xs text-slate-500 block">
                        {flat.building?.name} • Floor {flat.floor_number}
                      </span>
                    </div>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <ShieldAlert className="w-3 h-3" /> Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <ShieldCheck className="w-3 h-3" /> {daysRemaining}d left
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Handover:</span>
                      <span className="font-mono font-medium text-slate-800">{flat.possession_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Warranty Ends:</span>
                      <span className="font-mono font-bold text-indigo-700">{flat.calculated_maintenance_end_date}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (Hidden on screens < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Flat #</th>
                <th className="py-3.5 px-4">Tower & Project</th>
                <th className="py-3.5 px-4">Floor</th>
                <th className="py-3.5 px-4">Handover (Possession)</th>
                <th className="py-3.5 px-4">Calculated Warranty End Date</th>
                <th className="py-3.5 px-4">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlats.map(flat => {
                const isExpired = new Date(flat.calculated_maintenance_end_date) < new Date();
                const daysRemaining = Math.round(
                  (new Date(flat.calculated_maintenance_end_date).getTime() - Date.now()) / (1000 * 3600 * 24)
                );

                return (
                  <tr key={flat.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {flat.flat_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{flat.building?.name}</div>
                      <div className="text-[11px] text-slate-500">{flat.project?.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      Floor {flat.floor_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {flat.possession_date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {flat.calculated_maintenance_end_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          <ShieldAlert className="w-3 h-3" /> Expired ({Math.abs(daysRemaining)}d ago)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Active ({daysRemaining} days left)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Flat */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register Flat & Handover Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateFlat} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Project *:</label>
                <select
                  value={projectId}
                  onChange={e => handleProjectSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.free_maintenance_duration_months} mo warranty)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tower / Block *:</label>
                <select
                  value={buildingId}
                  onChange={e => setBuildingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {buildings
                    .filter(b => b.project_id === projectId)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Flat Number *:</label>
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={e => setFlatNumber(e.target.value)}
                    placeholder="e.g. A-504"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Floor Number:</label>
                  <input
                    type="number"
                    value={floorNumber}
                    onChange={e => setFloorNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Actual Possession Date *:</label>
                <input
                  type="date"
                  required
                  value={possessionDate}
                  onChange={e => setPossessionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-[11px] text-indigo-900 font-semibold block">
                  Automated Calculation Result:
                </span>
                <div className="text-xs text-indigo-800 mt-1">
                  Possession: <strong className="font-mono">{possessionDate}</strong> +{' '}
                  <strong>{projectedDuration} Months</strong> Project Warranty
                </div>
                <div className="text-xs font-bold text-indigo-950 mt-0.5">
                  ➜ Calculated Maintenance End Date: <span className="font-mono">{previewEndDate}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
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
                  Add Flat Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
