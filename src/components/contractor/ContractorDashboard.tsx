import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, SiteVisit, Quotation } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  HardHat,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  Eye,
  AlertCircle,
  CheckCircle2,
  Camera,
  Play,
  Pause,
} from 'lucide-react';

export const ContractorDashboard: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useNotifications();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'visits' | 'quotations' | 'progress' | 'completed'>('assigned');
  const [loading, setLoading] = useState(true);

  // Selected complaint for actions
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Modal states
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Visit form
  const [visitSchedule, setVisitSchedule] = useState(new Date().toISOString().slice(0, 16));
  const [findings, setFindings] = useState('');
  const [workRequired, setWorkRequired] = useState('');
  const [materialsRequired, setMaterialsRequired] = useState('');
  const [quotationRequired, setQuotationRequired] = useState(true);

  // Quotation form
  const [labourCharges, setLabourCharges] = useState(0);
  const [materialCosts, setMaterialCosts] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [workDescription, setWorkDescription] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(1);

  // Completion form
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Contractors see ONLY jobs assigned to them
      const all = await api.getComplaints({ contractorUserId: currentUser.id });
      setComplaints(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const totalQuotationAmount =
    Number(labourCharges || 0) +
    Number(materialCosts || 0) +
    Number(taxes || 0) +
    Number(otherCharges || 0);

  // Handle Record Visit
  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      await api.recordSiteVisit({
        complaint_id: selectedComplaint.id,
        contractor_id: selectedComplaint.assigned_contractor_id!,
        scheduled_at: visitSchedule,
        visited_at: new Date().toISOString(),
        inspection_findings: findings,
        work_required: workRequired,
        materials_required: materialsRequired,
        quotation_required: quotationRequired,
        actor: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      showToast('success', 'Site Visit Recorded', 'Technical inspection findings successfully saved.');
      setShowVisitModal(false);
      setFindings('');
      setWorkRequired('');
      loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit Quotation
  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (totalQuotationAmount <= 0) {
      showToast('warning', 'Invalid Amount', 'Quotation total must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitQuotation({
        complaint_id: selectedComplaint.id,
        contractor_id: selectedComplaint.assigned_contractor_id!,
        labour_charges: labourCharges,
        material_costs: materialCosts,
        taxes: taxes,
        other_charges: otherCharges,
        work_description: workDescription,
        estimated_duration_days: estimatedDays,
        actor: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      showToast('success', 'Quotation Submitted', 'Submitted for builder evaluation against threshold policy.');
      setShowQuotationModal(false);
      setLabourCharges(0);
      setMaterialCosts(0);
      setTaxes(0);
      setOtherCharges(0);
      setWorkDescription('');
      loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Work Status Update
  const handleStatusUpdate = async (complaintId: string, status: 'work_in_progress' | 'on_hold', notes: string) => {
    try {
      await api.updateWorkStatus({
        complaint_id: complaintId,
        new_status: status,
        notes,
        actor: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      showToast('success', 'Status Updated', `Work status changed to ${status.replace(/_/g, ' ')}`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  // Handle Submit Completion Evidence
  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!completionNotes.trim()) {
      showToast('warning', 'Notes Required', 'Please enter work completion details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitCompletionEvidence({
        complaint_id: selectedComplaint.id,
        completion_notes: completionNotes,
        actor: { id: currentUser.id, name: currentUser.full_name, role: currentRole },
      });
      showToast('success', 'Completion Submitted', 'Notification sent to flat owner for sign-off.');
      setShowCompleteModal(false);
      setCompletionNotes('');
      loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter based on selected contractor tab
  const getTabComplaints = () => {
    switch (activeTab) {
      case 'visits':
        return complaints.filter(c => c.status === 'assigned' || c.status === 'visit_scheduled');
      case 'quotations':
        return complaints.filter(
          c => c.status === 'awaiting_quotation' || c.status === 'quotation_submitted' || c.status === 'awaiting_approval' || c.status === 'revision_requested'
        );
      case 'progress':
        return complaints.filter(c => c.status === 'authorized_to_proceed' || c.status === 'work_in_progress' || c.status === 'on_hold');
      case 'completed':
        return complaints.filter(c => c.status === 'work_completed' || c.status === 'awaiting_resident_confirmation' || c.status === 'closed');
      default:
        return complaints;
    }
  };

  const displayedComplaints = getTabComplaints();

  return (
    <div className="space-y-6">
      {/* Contractor Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5" /> Contractor Portal
            </span>
            <span className="text-xs text-slate-400">Strict Data Isolation</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Contractor Work Queue</h1>
          <p className="text-xs text-slate-500">
            Welcome, <strong>{currentUser.full_name}</strong>. Access is isolated to jobs specifically assigned to your organization.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'assigned'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Assigned Jobs ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'visits'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Site Visits & Inspection ({complaints.filter(c => c.status === 'assigned' || c.status === 'visit_scheduled').length})
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'quotations'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quotations Queue ({complaints.filter(c => c.status === 'awaiting_quotation' || c.status === 'awaiting_approval' || c.status === 'revision_requested').length})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'progress'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Work In Progress ({complaints.filter(c => c.status === 'authorized_to_proceed' || c.status === 'work_in_progress' || c.status === 'on_hold').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'completed'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed Jobs ({complaints.filter(c => c.status === 'work_completed' || c.status === 'awaiting_resident_confirmation' || c.status === 'closed').length})
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {displayedComplaints.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No jobs in this category currently.
          </div>
        ) : (
          displayedComplaints.map(comp => {
            const quotation = comp.quotations?.[0];
            const canRecordVisit = comp.status === 'assigned' || comp.status === 'visit_scheduled';
            const canSubmitQuotation = comp.status === 'awaiting_quotation' || comp.status === 'revision_requested' || (comp.status === 'inspection_completed' && !quotation);
            const canStartWork = comp.status === 'authorized_to_proceed';
            const canUpdateWork = comp.status === 'work_in_progress' || comp.status === 'on_hold';
            const canSubmitCompletion = comp.status === 'work_in_progress';

            return (
              <div
                key={comp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-200 transition-colors"
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
                      Unit: <strong className="text-slate-800">{comp.flat?.flat_number}</strong> • {comp.building?.name} ({comp.project?.name})
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canRecordVisit && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(comp);
                          setShowVisitModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Log Site Inspection</span>
                      </button>
                    )}

                    {canSubmitQuotation && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(comp);
                          setShowQuotationModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Submit Quotation</span>
                      </button>
                    )}

                    {canStartWork && (
                      <button
                        onClick={() => handleStatusUpdate(comp.id, 'work_in_progress', 'Contractor started execution on site.')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {canSubmitCompletion && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(comp);
                          setShowCompleteModal(true);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Job Completed</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description & Preferred Visit */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <p>{comp.description}</p>
                  <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                    <span>Resident Preferred Window: <strong>{comp.preferred_visit_time || 'Flexible'}</strong></span>
                  </div>
                </div>

                {/* Status-specific banners */}
                {comp.status === 'awaiting_approval' && quotation && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      ⏳ Quotation #<strong>{quotation.quotation_number}</strong> ({quotation.total_amount.toLocaleString()} {quotation.currency}) is under review by Builder Admin. Work cannot start until authorized.
                    </span>
                    <span className="font-semibold text-amber-800 text-[11px]">Under Review</span>
                  </div>
                )}

                {comp.status === 'revision_requested' && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-900">
                    ⚠️ <strong>Revision Requested by Builder:</strong> Please adjust labour/materials and resubmit quotation.
                  </div>
                )}

                {comp.status === 'awaiting_resident_confirmation' && (
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                    <span>
                      ✓ Work completed. Submitted for flat owner inspection and confirmation.
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800">Pending Sign-off</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Record Site Visit & Inspection */}
      {showVisitModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Record Site Inspection — {selectedComplaint.complaint_reference}
              </h3>
              <button onClick={() => setShowVisitModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Inspection Findings *:</label>
                <textarea
                  required
                  value={findings}
                  onChange={e => setFindings(e.target.value)}
                  placeholder="Detail exact technical cause found on site (e.g. cracked pipe elbow, burnt insulation, misalignment)..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Required *:</label>
                <textarea
                  required
                  value={workRequired}
                  onChange={e => setWorkRequired(e.target.value)}
                  placeholder="Steps necessary to resolve (e.g. rewiring, replacement, pressure testing)..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Materials Required:</label>
                <input
                  type="text"
                  value={materialsRequired}
                  onChange={e => setMaterialsRequired(e.target.value)}
                  placeholder="e.g. 32A 4P MCB, 6sq mm copper leads, sealant..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quotationRequired}
                    onChange={e => setQuotationRequired(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Formal Quotation Required</span>
                    <span className="text-[11px] text-slate-500 block">
                      Requires submitting labour & material cost quotation before work begins.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Submit Quotation */}
      {showQuotationModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Submit Quotation — {selectedComplaint.complaint_reference}
              </h3>
              <button onClick={() => setShowQuotationModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmitQuotation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Labour Charges (₹):</label>
                  <input
                    type="number"
                    min={0}
                    value={labourCharges}
                    onChange={e => setLabourCharges(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Material Costs (₹):</label>
                  <input
                    type="number"
                    min={0}
                    value={materialCosts}
                    onChange={e => setMaterialCosts(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Taxes / GST (₹):</label>
                  <input
                    type="number"
                    min={0}
                    value={taxes}
                    onChange={e => setTaxes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Other / Transport (₹):</label>
                  <input
                    type="number"
                    min={0}
                    value={otherCharges}
                    onChange={e => setOtherCharges(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Automatic Total Calculation */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex justify-between items-center">
                <span className="font-bold text-indigo-900">Calculated Total Amount:</span>
                <span className="text-base font-extrabold text-indigo-950 font-mono">
                  ₹ {totalQuotationAmount.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope of Work Description *:</label>
                <textarea
                  required
                  value={workDescription}
                  onChange={e => setWorkDescription(e.target.value)}
                  placeholder="Comprehensive description of parts replaced, testing performed..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Duration (Days):</label>
                <input
                  type="number"
                  min={1}
                  value={estimatedDays}
                  onChange={e => setEstimatedDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Submit Completion Evidence */}
      {showCompleteModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Submit Completion Proof — {selectedComplaint.complaint_reference}
              </h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmitCompletion} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Performed & Evidence Details *:</label>
                <textarea
                  required
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Detail work completed, testing verified in presence of resident, cleanup done..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Upload Simulation */}
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-slate-600 font-medium block">Photographic Completion Proof</span>
                <span className="text-[10px] text-slate-400">JPG, PNG (Stored in private Supabase bucket: evidence)</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Sign Off & Notify Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
