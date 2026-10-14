import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Flat } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building,
  PlusCircle,
  Clock,
} from 'lucide-react';

interface ResidentFlatsViewProps {
  onRaiseComplaint: (flatId: string) => void;
}

export const ResidentFlatsView: React.FC<ResidentFlatsViewProps> = ({ onRaiseComplaint }) => {
  const { currentUser } = useAuth();
  const [flats, setFlats] = useState<(Flat & { is_primary_owner: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlats();
  }, [currentUser.id]);

  const loadFlats = async () => {
    setLoading(true);
    try {
      const data = await api.getResidentFlats(currentUser.id);
      setFlats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Home className="w-5 h-5 text-indigo-600" /> My Registered Flats & Warranty Status
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your possession handover details, free maintenance period, and submit service requests.
        </p>
      </div>

      {/* Flats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flats.map(flat => {
          const isExpired = new Date(flat.calculated_maintenance_end_date) < new Date();
          const daysRemaining = Math.round(
            (new Date(flat.calculated_maintenance_end_date).getTime() - Date.now()) / (1000 * 3600 * 24)
          );

          return (
            <div
              key={flat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {flat.is_primary_owner ? 'Primary Owner' : 'Authorized Resident'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                    Unit {flat.flat_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {flat.building?.name} • {flat.project?.name}
                  </p>
                </div>
                {isExpired ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" /> Warranty Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Under Warranty
                  </span>
                )}
              </div>

              {/* Handover & Warranty Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Possession Handover:</span>
                  <span className="font-semibold text-slate-800 font-mono">{flat.possession_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Maintenance End:</span>
                  <span className="font-bold text-indigo-700 font-mono">{flat.calculated_maintenance_end_date}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px]">
                  <span className="text-slate-500">Project Warranty Policy:</span>
                  <span className="text-slate-700 font-medium">
                    {flat.project?.free_maintenance_duration_months} Months Free Service
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {!isExpired ? (
                    <strong className="text-emerald-700">{daysRemaining} days remaining</strong>
                  ) : (
                    <span className="text-rose-600">Ended {Math.abs(daysRemaining)} days ago</span>
                  )}
                </span>
                <button
                  onClick={() => onRaiseComplaint(flat.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Raise Complaint</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
