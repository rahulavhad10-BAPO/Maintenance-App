import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, Contractor, CoverageResult, Quotation } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  ArrowLeft,
  Building,
  Home,
  User,
  Calendar,
  Shield,
  HardHat,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  ThumbsUp,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

interface ComplaintDetailProps {
  complaintId: string;
  onBack: () => void;
  onRefresh?: () => void;
}

export const ComplaintDetail: React.FC<ComplaintDetailProps> = ({
  complaintId,
  onBack,
  onRefresh,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useNotifications();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [newCoverage, setNewCoverage] = useState<CoverageResult>('within_coverage');
  const [coverageReason, setCoverageReason] = useState('');

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'approved_under_threshold' | 'rejected' | 'revision_requested'>('approved');
  const [approvalReason, setApprovalReason] = useState('');
  const [targetQuotation, setTargetQuotation] = useState<Quotation | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComplaint = async () => {
    setLoading(true);
    try {
      const [comp, cnts] = await Promise.all([
        api.getComplaintById(complaintId),
        api.getContractors(),
      ]);
      setComplaint(comp || null);
      setContractors(cnts);
      if (comp?.assigned_contractor_id) {
        setSelectedContractorId(comp.assigned_contractor_id);
      }
    } catch (e) {
      console.error('Failed to load complaint details:', e);
      showToast('error', 'Load Error', 'Unable to fetch complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  if (loading || !complaint) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading complaint record and audit trail...</p>
      </div>
    );
  }

  // Permission checks
  const canAssignContractor = currentRole === 'builder_admin' || currentRole === 'super_admin' || currentRole === 'receptionist';
  const canOverrideCoverage = currentRole === 'builder_admin' || currentRole === 'super_admin';
  const canApproveQuotations = currentRole === 'builder_admin' || currentRole === 'super_admin';

  // Handle Contractor Assignment
  const handleAssignContractor = async () => {
    if (!selectedContractorId) {
      showToast('warning', 'Selection Required', 'Please choose a contractor.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await api.assignContractor(
        complaint.id,
        selectedContractorId,
        { id: currentUser.id, name: currentUser.full_name, role: currentRole },
        assignNotes
      );
      setComplaint(updated);
      setShowAssignModal(false);
      setAssignNotes('');
      showToast('success', 'Contractor Assigned', 'The maintenance vendor has been notified.');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast('error', 'Assignment Failed', e.message || 'Could not assign contractor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Coverage Override
  const handleOverrideCoverage = async () => {
    if (!coverageReason.trim()) {
      showToast('warning', 'Mandatory Reason', 'A written reason is required to override maintenance coverage.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await api.overrideCoverage({
        complaint_id: complaint.id,
        new_coverage: newCoverage,
        reason: coverageReason,
        actor: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      setComplaint(updated);
      setShowCoverageModal(false);
      setCoverageReason('');
      showToast('success', 'Coverage Updated', 'Warranty assessment has been manually updated with audit log.');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast('error', 'Override Failed', e.message || 'Could not update coverage');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quotation Approval / Rejection
  const handleQuotationDecision = async () => {
    if (!targetQuotation) return;

    if (
      (approvalDecision === 'rejected' || approvalDecision === 'revision_requested') &&
      !approvalReason.trim()
    ) {
      showToast('warning', 'Mandatory Reason', 'A reason is required when rejecting or requesting revision.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.reviewQuotation({
        quotation_id: targetQuotation.id,
        decision: approvalDecision,
        decision_reason: approvalReason,
        approver: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      setShowApprovalModal(false);
      setApprovalReason('');
      setTargetQuotation(null);
      showToast('success', 'Quotation Decision Recorded', `Decision: ${approvalDecision.replace(/_/g, ' ').toUpperCase()}`);
      loadComplaint();
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast('error', 'Decision Error', e.message || 'Could not process quotation decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectThreshold = complaint.project?.quotation_approval_threshold ?? 5000;
  const projectCurrency = complaint.project?.default_currency || 'INR';

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors border border-slate-200"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-bold text-indigo-700">
                {complaint.complaint_reference}
              </span>
              <StatusBadge status={complaint.status} />
              <StatusBadge priority={complaint.priority} />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{complaint.title}</h1>
          </div>
        </div>

        {/* Action Controls for Admin */}
        <div className="flex items-center space-x-2">
          {canAssignContractor && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>{complaint.assigned_contractor_id ? 'Reassign Contractor' : 'Assign Contractor'}</span>
            </button>
          )}

          {canOverrideCoverage && (
            <button
              onClick={() => {
                setNewCoverage(complaint.coverage_result);
                setShowCoverageModal(true);
              }}
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Override Coverage</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details on Left, Timeline & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Property, Possession & Warranty Coverage Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" /> Property & Maintenance Coverage Assessment
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Flat / Unit</span>
                <span className="font-bold text-slate-800 text-sm">{complaint.flat?.flat_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Building & Project</span>
                <span className="font-medium text-slate-800">
                  {complaint.building?.name} ({complaint.project?.code})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Possession Date</span>
                <span className="font-medium text-slate-800 font-mono">
                  {complaint.flat?.possession_date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Warranty End Date</span>
                <span className="font-bold text-indigo-700 font-mono">
                  {complaint.flat?.calculated_maintenance_end_date}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({complaint.project?.free_maintenance_duration_months} mo period)
                </span>
              </div>
            </div>

            {/* Coverage Status Banner */}
            <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/70 border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-700">Calculated Assessment:</span>
                <StatusBadge coverage={complaint.coverage_result} />
              </div>
              {complaint.coverage_override_reason && (
                <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  <strong>Override Reason:</strong> {complaint.coverage_override_reason}
                </div>
              )}
            </div>

            {/* Description & Preferred time */}
            <div>
              <span className="text-slate-400 block text-xs font-medium mb-1">Issue Description</span>
              <p className="text-xs text-slate-800 bg-slate-50/50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <strong className="text-slate-800">{complaint.category?.name}</strong>
              </div>
              {complaint.subcategory && (
                <div>
                  <span className="text-slate-400">Subcategory:</span>{' '}
                  <strong className="text-slate-800">{complaint.subcategory}</strong>
                </div>
              )}
              <div>
                <span className="text-slate-400">Preferred Visit Time:</span>{' '}
                <strong className="text-slate-800">{complaint.preferred_visit_time || 'Flexible'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Source Channel:</span>{' '}
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700 uppercase">
                  {complaint.source_channel.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Contractor Quotations & Threshold Evaluation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Quotation & Configurable Threshold Evaluation
              </h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                Threshold: {projectThreshold.toLocaleString()} {projectCurrency}
              </span>
            </div>

            {complaint.quotations && complaint.quotations.length > 0 ? (
              <div className="space-y-4">
                {complaint.quotations.map(quo => {
                  const isExceeding = quo.total_amount > projectThreshold;
                  const canBeReviewed =
                    canApproveQuotations &&
                    (quo.status === 'awaiting_approval' || quo.status === 'submitted' || quo.status === 'under_review');

                  return (
                    <div
                      key={quo.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {quo.quotation_number}
                            </span>
                            <StatusBadge quotationStatus={quo.status} />
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Contractor: {quo.contractor?.company_name} ({quo.contractor?.contact_name})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold text-slate-900">
                            {quo.total_amount.toLocaleString()} {quo.currency}
                          </span>
                          <span
                            className={`block text-[10px] font-semibold ${
                              isExceeding ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isExceeding
                              ? `⚠️ Exceeds Threshold by ${(quo.total_amount - projectThreshold).toLocaleString()} ${quo.currency}`
                              : `✓ Within Threshold (≤ ${projectThreshold.toLocaleString()} ${quo.currency})`}
                          </span>
                        </div>
                      </div>

                      {/* Line Item Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-3 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400">Labour Charges:</span>
                          <span className="font-medium text-slate-800 block">
                            {quo.labour_charges.toLocaleString()} {quo.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Material Costs:</span>
                          <span className="font-medium text-slate-800 block">
                            {quo.material_costs.toLocaleString()} {quo.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Taxes:</span>
                          <span className="font-medium text-slate-800 block">
                            {quo.taxes.toLocaleString()} {quo.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Other / Misc:</span>
                          <span className="font-medium text-slate-800 block">
                            {quo.other_charges.toLocaleString()} {quo.currency}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Work Scope Description</span>
                        <p className="text-xs text-slate-700 mt-0.5">{quo.work_description}</p>
                      </div>

                      {/* Approval History / Decision Display */}
                      {quo.approvals && quo.approvals.length > 0 && (
                        <div className="border-t border-slate-200 pt-2 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500">Decision Record:</span>
                          {quo.approvals.map(app => (
                            <div key={app.id} className="text-[11px] text-slate-700 mt-1">
                              • <strong>{app.decision.replace(/_/g, ' ').toUpperCase()}</strong> by {app.approver?.full_name || 'Admin'}
                              {app.decision_reason && ` — Reason: "${app.decision_reason}"`}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin Decision Action Button */}
                      {canBeReviewed && (
                        <div className="pt-2 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => {
                              setTargetQuotation(quo);
                              setApprovalDecision(isExceeding ? 'approved' : 'approved_under_threshold');
                              setShowApprovalModal(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Evaluate & Make Decision</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No quotations submitted yet for this complaint.
              </div>
            )}
          </div>

          {/* Card 3: Site Visits & Inspections */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" /> Site Visit & Technical Inspection Records
            </h2>

            {complaint.site_visits && complaint.site_visits.length > 0 ? (
              <div className="space-y-3">
                {complaint.site_visits.map(v => (
                  <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">
                        {v.contractor?.company_name} ({v.contractor?.contact_name})
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Visited: {v.visited_at ? new Date(v.visited_at).toLocaleDateString() : 'Scheduled'}
                      </span>
                    </div>
                    {v.inspection_findings && (
                      <div>
                        <span className="text-slate-400 text-[11px] block">Technical Findings:</span>
                        <p className="text-slate-700">{v.inspection_findings}</p>
                      </div>
                    )}
                    {v.work_required && (
                      <div>
                        <span className="text-slate-400 text-[11px] block">Work Required:</span>
                        <p className="text-slate-700">{v.work_required}</p>
                      </div>
                    )}
                    {v.materials_required && (
                      <div>
                        <span className="text-slate-400 text-[11px] block">Materials:</span>
                        <p className="text-slate-700">{v.materials_required}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                No site inspections recorded yet.
              </p>
            )}
          </div>

          {/* Card 4: Work Completion & Resident Sign-off */}
          {complaint.completion_notes && (
            <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Work Completion Evidence
              </h3>
              <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-emerald-100">
                {complaint.completion_notes}
              </p>
              {complaint.resident_confirmed_at && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-800">Resident Confirmed & Closed:</span>{' '}
                    <span>{complaint.resident_remarks || 'Work verified satisfactory.'}</span>
                  </div>
                  {complaint.resident_feedback_rating && (
                    <span className="text-amber-500 font-bold">
                      {'★'.repeat(complaint.resident_feedback_rating)} ({complaint.resident_feedback_rating}/5)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Contractor Info & Activity Log Audit Trail */}
        <div className="space-y-6">
          {/* Assigned Contractor Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-indigo-600" /> Assigned Contractor
            </h3>
            {complaint.contractor ? (
              <div className="text-xs space-y-2">
                <div className="font-bold text-slate-900 text-sm">{complaint.contractor.company_name}</div>
                <div className="text-slate-600">Contact: {complaint.contractor.contact_name}</div>
                <div className="text-slate-500">Phone: {complaint.contractor.phone}</div>
                <div className="text-slate-500">Email: {complaint.contractor.email}</div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {complaint.contractor.service_categories.map(cat => (
                    <span key={cat} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-100">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-amber-600 text-xs font-medium block">No contractor assigned yet</span>
                {canAssignContractor && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Assign eligible vendor
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Immutable Activity Log Audit Trail */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Immutable Audit Timeline
            </h3>

            <div className="flow-root">
              <ul className="-mb-4 space-y-4">
                {complaint.activity_logs && complaint.activity_logs.length > 0 ? (
                  complaint.activity_logs.map(log => (
                    <li key={log.id} className="relative pb-4">
                      <div className="relative flex items-start space-x-2.5">
                        <div className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800">
                            {log.actor_name || 'System'}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({log.actor_role || 'audit'})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{log.notes}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(log.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">No activity recorded yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Assign Contractor */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Assign Contractor to Job</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Maintenance Vendor:</label>
                <select
                  value={selectedContractorId}
                  onChange={e => setSelectedContractorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Contractor --</option>
                  {contractors.map(c => {
                    const matchesCategory = c.service_categories.includes(complaint.category?.name || '');
                    return (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.contact_name}) {matchesCategory ? '★ Category Match' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dispatch Notes / Instructions:</label>
                <textarea
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  placeholder="Special instructions, gate access instructions, tenant availability..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignContractor}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Coverage Override with Mandatory Reason */}
      {showCoverageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Override Maintenance Coverage</h3>
              <button onClick={() => setShowCoverageModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                <strong>Governance Rule:</strong> Overriding initial coverage is an operational decision and requires a mandatory reason recorded in the permanent audit trail.
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Coverage Status:</label>
                <select
                  value={newCoverage}
                  onChange={e => setNewCoverage(e.target.value as CoverageResult)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="within_coverage">Within Coverage (Covered by Builder)</option>
                  <option value="outside_coverage">Outside Coverage (Expired / Excluded)</option>
                  <option value="coverage_review_required">Coverage Review Required</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mandatory Reason for Override <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={coverageReason}
                  onChange={e => setCoverageReason(e.target.value)}
                  placeholder="e.g., Goodwill extension approved by Builder Director, or special defect liability amendment..."
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCoverageModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideCoverage}
                disabled={isSubmitting || !coverageReason.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Quotation Approval Decision */}
      {showApprovalModal && targetQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Quotation Decision — {targetQuotation.quotation_number}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Total: {targetQuotation.total_amount.toLocaleString()} {targetQuotation.currency} vs Threshold: {projectThreshold.toLocaleString()} {targetQuotation.currency}
                </span>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {targetQuotation.total_amount > projectThreshold ? (
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-900 text-[11px]">
                  <strong>Approval Rule:</strong> This quotation strictly exceeds the project threshold of{' '}
                  {projectThreshold.toLocaleString()} {targetQuotation.currency}. It cannot be marked "Approved Under Threshold".
                </div>
              ) : (
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-teal-900 text-[11px]">
                  <strong>Threshold Rule:</strong> This quotation is within the project threshold (≤{' '}
                  {projectThreshold.toLocaleString()} {targetQuotation.currency}) and qualifies for "Approved Under Threshold".
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  {targetQuotation.total_amount <= projectThreshold && (
                    <button
                      type="button"
                      onClick={() => setApprovalDecision('approved_under_threshold')}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                        approvalDecision === 'approved_under_threshold'
                          ? 'bg-teal-50 border-teal-400 text-teal-900 ring-2 ring-teal-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs">Approved Under Threshold</span>
                      <span className="text-[10px] font-normal text-slate-500">Amount ≤ threshold rule</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setApprovalDecision('approved')}
                    className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                      approvalDecision === 'approved'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs">Approve (&gt; Threshold)</span>
                    <span className="text-[10px] font-normal text-slate-500">Authorized by manager</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalDecision('revision_requested')}
                    className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                      approvalDecision === 'revision_requested'
                        ? 'bg-orange-50 border-orange-400 text-orange-900 ring-2 ring-orange-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs">Request Revision</span>
                    <span className="text-[10px] font-normal text-slate-500">Contractor adjusts scope</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalDecision('rejected')}
                    className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                      approvalDecision === 'rejected'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs">Reject Quotation</span>
                    <span className="text-[10px] font-normal text-slate-500">Disallow repair costs</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason / Notes {approvalDecision === 'rejected' || approvalDecision === 'revision_requested' ? '(Mandatory *)' : '(Optional)'}:
                </label>
                <textarea
                  value={approvalReason}
                  onChange={e => setApprovalReason(e.target.value)}
                  placeholder="Record policy justification, rate negotiation notes, or reasons for rejection..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleQuotationDecision}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
