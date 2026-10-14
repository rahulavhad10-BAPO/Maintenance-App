import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, Quotation } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  CheckSquare,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
} from 'lucide-react';

interface QuotationApprovalsProps {
  onViewComplaint: (complaint: Complaint) => void;
}

export const QuotationApprovals: React.FC<QuotationApprovalsProps> = ({ onViewComplaint }) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useNotifications();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedQuo, setSelectedQuo] = useState<{ quo: Quotation; comp: Complaint } | null>(null);
  const [decision, setDecision] = useState<'approved' | 'approved_under_threshold' | 'rejected' | 'revision_requested'>('approved');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await api.getComplaints();
      setComplaints(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Gather all quotations
  const allQuotationsWithComplaints: { quo: Quotation; comp: Complaint }[] = [];
  complaints.forEach(comp => {
    if (comp.quotations) {
      comp.quotations.forEach(quo => {
        allQuotationsWithComplaints.push({ quo, comp });
      });
    }
  });

  const pendingApprovals = allQuotationsWithComplaints.filter(
    item => item.quo.status === 'awaiting_approval' || item.quo.status === 'submitted' || item.quo.status === 'under_review'
  );

  const pastDecisions = allQuotationsWithComplaints.filter(
    item => item.quo.status === 'approved' || item.quo.status === 'approved_under_threshold' || item.quo.status === 'rejected' || item.quo.status === 'revision_requested'
  );

  const handleReview = async () => {
    if (!selectedQuo) return;
    if ((decision === 'rejected' || decision === 'revision_requested') && !reason.trim()) {
      showToast('warning', 'Mandatory Reason', 'A reason is required when rejecting or requesting a revision.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.reviewQuotation({
        quotation_id: selectedQuo.quo.id,
        decision,
        decision_reason: reason,
        approver: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      showToast('success', 'Quotation Decision Saved', `Recorded as ${decision.replace(/_/g, ' ').toUpperCase()}`);
      setSelectedQuo(null);
      setReason('');
      loadData();
    } catch (e: any) {
      showToast('error', 'Decision Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-indigo-600" /> Quotation Approvals & Threshold Governance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review repair quotations submitted by contractors against the project's configured threshold rule.
        </p>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Pending Sign-off Queue ({pendingApprovals.length})
          </h2>
          <span className="text-xs text-slate-400">Action Required</span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ✓ No quotations currently awaiting review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Complaint</th>
                  <th className="py-3 px-4">Contractor</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Rule Evaluation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.map(({ quo, comp }) => {
                  const threshold = comp.project?.quotation_approval_threshold ?? 5000;
                  const isExceeding = quo.total_amount > threshold;

                  return (
                    <tr key={quo.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {quo.quotation_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{comp.complaint_reference}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{comp.title}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{quo.contractor?.company_name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {quo.total_amount.toLocaleString()} {quo.currency}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {threshold.toLocaleString()} {quo.currency}
                      </td>
                      <td className="py-3.5 px-4">
                        {isExceeding ? (
                          <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            ⚠️ Exceeds Threshold
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            ✓ Under Threshold
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedQuo({ quo, comp });
                            setDecision(isExceeding ? 'approved' : 'approved_under_threshold');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Review & Decide
                        </button>
                        <button
                          onClick={() => onViewComplaint(comp)}
                          className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-slate-100"
                          title="View complete complaint record"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Decisions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Historical Decisions & Approvals Audit
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Complaint</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit Notes / Reason</th>
                <th className="py-3 px-4 text-right">Complaint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastDecisions.map(({ quo, comp }) => (
                <tr key={quo.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-slate-800">{quo.quotation_number}</td>
                  <td className="py-3 px-4">{comp.complaint_reference}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {quo.total_amount.toLocaleString()} {quo.currency}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge quotationStatus={quo.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px] max-w-sm">
                    {quo.approvals?.[0]?.decision_reason || quo.approvals?.[0]?.policy_notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewComplaint(comp)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Decision */}
      {selectedQuo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Quotation Review: {selectedQuo.quo.quotation_number}
              </h3>
              <button onClick={() => setSelectedQuo(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="text-xs space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Quotation Total:</span>
                  <span className="text-indigo-700 text-sm font-bold">
                    {selectedQuo.quo.total_amount.toLocaleString()} {selectedQuo.quo.currency}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 mt-1">
                  <span>Project Threshold:</span>
                  <span>
                    {(selectedQuo.comp.project?.quotation_approval_threshold ?? 5000).toLocaleString()}{' '}
                    {selectedQuo.quo.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedQuo.quo.total_amount <= (selectedQuo.comp.project?.quotation_approval_threshold ?? 5000) && (
                    <button
                      type="button"
                      onClick={() => setDecision('approved_under_threshold')}
                      className={`p-2 rounded-lg border text-left font-medium text-xs ${
                        decision === 'approved_under_threshold'
                          ? 'bg-teal-50 border-teal-400 text-teal-900 ring-2 ring-teal-500/20'
                          : 'border-slate-200'
                      }`}
                    >
                      Approved Under Threshold
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`p-2 rounded-lg border text-left font-medium text-xs ${
                      decision === 'approved'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200'
                    }`}
                  >
                    Approve Work
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('revision_requested')}
                    className={`p-2 rounded-lg border text-left font-medium text-xs ${
                      decision === 'revision_requested'
                        ? 'bg-orange-50 border-orange-400 text-orange-900 ring-2 ring-orange-500/20'
                        : 'border-slate-200'
                    }`}
                  >
                    Request Revision
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`p-2 rounded-lg border text-left font-medium text-xs ${
                      decision === 'rejected'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20'
                        : 'border-slate-200'
                    }`}
                  >
                    Reject Quotation
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason / Justification Notes {decision === 'rejected' || decision === 'revision_requested' ? '(Mandatory *)' : '(Optional)'}:
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Record justification, notes on labour rates or material exclusions..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedQuo(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
