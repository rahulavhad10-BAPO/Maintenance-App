import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList,
  PlusCircle,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';

interface ResidentComplaintsListProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onRaiseNew: () => void;
}

export const ResidentComplaintsList: React.FC<ResidentComplaintsListProps> = ({
  onSelectComplaint,
  onRaiseNew,
}) => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaints({ residentId: currentUser.id });
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" /> My Maintenance Requests & Status
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track technician visits, repairs, and verify completion sign-offs for your flats.
          </p>
        </div>

        <button
          onClick={onRaiseNew}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise New Complaint</span>
        </button>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No active maintenance complaints</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Everything in your flats is in top shape! If you encounter an issue, lodge a request to dispatch a contractor.
            </p>
            <button
              onClick={onRaiseNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
            >
              Raise Request
            </button>
          </div>
        ) : (
          complaints.map(comp => (
            <div
              key={comp.id}
              onClick={() => onSelectComplaint(comp)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">
                      {comp.complaint_reference}
                    </span>
                    <StatusBadge status={comp.status} />
                    <StatusBadge priority={comp.priority} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{comp.title}</h3>
                  <p className="text-xs text-slate-500">
                    Unit: <strong className="text-slate-800">{comp.flat?.flat_number}</strong> • {comp.building?.name}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    Reported: {new Date(comp.created_at).toLocaleDateString()}
                  </span>
                  <StatusBadge coverage={comp.coverage_result} className="mt-1" />
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {comp.description}
              </p>

              {/* Status specific indicators for resident */}
              {comp.status === 'awaiting_resident_confirmation' && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-900 flex justify-between items-center">
                  <span>
                    🎉 <strong>Work Completed:</strong> The contractor has marked repairs as finished. Please inspect and confirm resolution!
                  </span>
                  <span className="font-bold text-violet-800 bg-white px-2.5 py-1 rounded-lg border border-violet-300">
                    Sign-off Required
                  </span>
                </div>
              )}

              {comp.contractor && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>
                    Assigned Contractor: <strong className="text-slate-700">{comp.contractor.company_name}</strong>
                  </span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> View Details & Timeline
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
