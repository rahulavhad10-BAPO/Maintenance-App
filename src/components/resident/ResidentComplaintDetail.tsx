import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  ArrowLeft,
  Home,
  HardHat,
  Calendar,
  CheckCircle,
  RotateCcw,
  Star,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface ResidentComplaintDetailProps {
  complaintId: string;
  onBack: () => void;
  onRefresh?: () => void;
}

export const ResidentComplaintDetail: React.FC<ResidentComplaintDetailProps> = ({
  complaintId,
  onBack,
  onRefresh,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useNotifications();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign-off / Dispute modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'reopen'>('confirm');
  const [remarks, setRemarks] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaintById(complaintId);
      setComplaint(data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [complaintId]);

  if (loading || !complaint) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
        Loading complaint record...
      </div>
    );
  }

  const handleResidentAction = async () => {
    if (actionType === 'reopen' && !remarks.trim()) {
      showToast('warning', 'Remarks Required', 'Please explain what remains unresolved.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.residentConfirmOrReopen({
        complaint_id: complaint.id,
        action: actionType,
        remarks: remarks.trim(),
        rating: actionType === 'confirm' ? rating : undefined,
        actor: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      setComplaint(updated);
      setShowConfirmModal(false);
      setRemarks('');
      showToast(
        'success',
        actionType === 'confirm' ? 'Complaint Closed & Confirmed!' : 'Ticket Reopened',
        actionType === 'confirm' ? 'Thank you for your rating.' : 'Contractor has been notified to re-inspect.'
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAwaitingResident = complaint.status === 'awaiting_resident_confirmation';
  const isClosed = complaint.status === 'closed';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-indigo-700">
              {complaint.complaint_reference}
            </span>
            <StatusBadge status={complaint.status} />
            <StatusBadge priority={complaint.priority} />
          </div>
          <h1 className="text-base font-bold text-slate-900 mt-0.5">{complaint.title}</h1>
        </div>
      </div>

      {/* Verification Action Banner (When work is completed) */}
      {isAwaitingResident && (
        <div className="bg-violet-600 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-violet-200" /> Maintenance Work Completed
            </h2>
            <p className="text-xs text-violet-100 mt-1 max-w-xl">
              The assigned contractor has finished repairs and submitted photographic proof. Please inspect your flat and confirm if the defect is completely resolved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setActionType('confirm');
                setShowConfirmModal(true);
              }}
              className="bg-white hover:bg-violet-50 text-violet-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors text-center"
            >
              Confirm & Close
            </button>
            <button
              onClick={() => {
                setActionType('reopen');
                setShowConfirmModal(true);
              }}
              className="bg-violet-800 hover:bg-violet-900 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors border border-violet-400 text-center"
            >
              Report Issue Unresolved
            </button>
          </div>
        </div>
      )}

      {/* Closed Banner */}
      {isClosed && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>
              This maintenance ticket was successfully confirmed and closed by you.
            </span>
          </div>
          {complaint.resident_feedback_rating && (
            <span className="text-amber-500 font-bold">
              {'★'.repeat(complaint.resident_feedback_rating)} ({complaint.resident_feedback_rating}/5)
            </span>
          )}
        </div>
      )}

      {/* Main Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Issue Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              Issue Information
            </h2>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Flat Unit</span>
                <span className="font-bold text-slate-800 text-sm">{complaint.flat?.flat_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Building & Project</span>
                <span className="font-semibold text-slate-800">
                  {complaint.building?.name} ({complaint.project?.name})
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Description</span>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Contractor Completion Notes */}
            {complaint.completion_notes && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 block text-xs">
                  Contractor Work Performed:
                </span>
                <p className="text-slate-800 bg-white p-3 rounded-lg border border-emerald-100">
                  {complaint.completion_notes}
                </p>
              </div>
            )}
          </div>

          {/* Site Inspection Notes */}
          {complaint.site_visits && complaint.site_visits.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h2 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Technician Inspection Findings
              </h2>
              {complaint.site_visits.map(v => (
                <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{v.contractor?.company_name}</span>
                    <span className="text-slate-400 text-[10px]">
                      {v.visited_at ? new Date(v.visited_at).toLocaleDateString() : 'Scheduled'}
                    </span>
                  </div>
                  <p className="text-slate-600">{v.inspection_findings}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contractor Info & Timeline */}
        <div className="space-y-6">
          {complaint.contractor && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-indigo-600" /> Assigned Service Contractor
              </h3>
              <div className="font-bold text-slate-900 text-sm">{complaint.contractor.company_name}</div>
              <div className="text-slate-600">Technician: {complaint.contractor.contact_name}</div>
              <div className="text-slate-500">Phone: {complaint.contractor.phone}</div>
            </div>
          )}

          {/* Activity Log (Filtered: Residents see only operational status logs, NOT internal builder notes) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Status Updates
            </h3>
            <ul className="space-y-3">
              {complaint.activity_logs?.map(log => (
                <li key={log.id} className="border-l-2 border-indigo-200 pl-3 space-y-0.5">
                  <div className="font-semibold text-slate-800 text-[11px]">{log.notes}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation / Dispute Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {actionType === 'confirm' ? 'Confirm Service & Close Complaint' : 'Report Issue Unresolved / Reopen'}
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {actionType === 'confirm' ? (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Rate the service:</label>
                    <div className="flex space-x-2 text-2xl text-amber-400 cursor-pointer">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          onClick={() => setRating(star)}
                          className={star <= rating ? 'text-amber-400' : 'text-slate-200'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Feedback Comments (Optional):</label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="e.g. Technician arrived on time and repaired leakage cleanly."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Describe what remains unresolved <span className="text-rose-600">*</span>:
                  </label>
                  <textarea
                    required
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Explain why the repair is incomplete or what issue persists..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleResidentAction}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs ${
                  actionType === 'confirm'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting
                  ? 'Saving...'
                  : actionType === 'confirm'
                  ? 'Confirm & Close Ticket'
                  : 'Reopen Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
