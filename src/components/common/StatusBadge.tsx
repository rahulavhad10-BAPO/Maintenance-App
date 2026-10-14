import React from 'react';
import { ComplaintStatus, PriorityLevel, CoverageResult, QuotationStatus } from '../../types/database';

interface StatusBadgeProps {
  status?: ComplaintStatus | string;
  priority?: PriorityLevel;
  coverage?: CoverageResult;
  quotationStatus?: QuotationStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  priority,
  coverage,
  quotationStatus,
  className = '',
}) => {
  if (priority) {
    const config = {
      low: 'bg-slate-100 text-slate-700 border-slate-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200',
      high: 'bg-amber-50 text-amber-700 border-amber-200',
      urgent: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold animate-pulse',
    }[priority] || 'bg-slate-100 text-slate-700 border-slate-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config} ${className}`}>
        {priority.toUpperCase()}
      </span>
    );
  }

  if (coverage) {
    const config = {
      within_coverage: {
        label: 'Within Coverage',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
      },
      outside_coverage: {
        label: 'Outside Coverage',
        classes: 'bg-rose-50 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
      },
      coverage_review_required: {
        label: 'Coverage Review Required',
        classes: 'bg-amber-50 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
      },
    }[coverage] || {
      label: coverage,
      classes: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  if (quotationStatus) {
    const config = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      submitted: 'bg-blue-50 text-blue-700 border-blue-200',
      under_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      awaiting_approval: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
      approved: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
      approved_under_threshold: 'bg-teal-50 text-teal-800 border-teal-300 font-medium',
      rejected: 'bg-rose-50 text-rose-800 border-rose-300 font-medium',
      revision_requested: 'bg-orange-50 text-orange-800 border-orange-300',
      withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
    }[quotationStatus] || 'bg-slate-100 text-slate-700 border-slate-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config} ${className}`}>
        {quotationStatus.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  }

  if (status) {
    const statusMap: Record<string, { label: string; color: string }> = {
      new: { label: 'New', color: 'bg-sky-50 text-sky-800 border-sky-300' },
      under_review: { label: 'Under Review', color: 'bg-purple-50 text-purple-800 border-purple-300' },
      awaiting_assignment: { label: 'Awaiting Assignment', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
      assigned: { label: 'Assigned', color: 'bg-blue-50 text-blue-800 border-blue-300' },
      visit_scheduled: { label: 'Visit Scheduled', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
      inspection_completed: { label: 'Inspection Done', color: 'bg-teal-50 text-teal-800 border-teal-300' },
      awaiting_quotation: { label: 'Awaiting Quotation', color: 'bg-amber-50 text-amber-800 border-amber-300' },
      quotation_submitted: { label: 'Quotation Submitted', color: 'bg-orange-50 text-orange-800 border-orange-300' },
      awaiting_approval: { label: 'Awaiting Approval', color: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' },
      revision_requested: { label: 'Revision Requested', color: 'bg-orange-50 text-orange-800 border-orange-300' },
      authorized_to_proceed: { label: 'Authorized to Proceed', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium' },
      work_in_progress: { label: 'Work In Progress', color: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-medium' },
      on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-900 border-amber-400' },
      work_completed: { label: 'Work Completed', color: 'bg-teal-100 text-teal-900 border-teal-400' },
      awaiting_resident_confirmation: { label: 'Awaiting Confirmation', color: 'bg-violet-50 text-violet-800 border-violet-300 font-medium' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-300' },
      out_of_scope: { label: 'Out of Scope', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    };

    const s = statusMap[status] || { label: status.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-700 border-slate-200' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color} ${className}`}>
        {s.label}
      </span>
    );
  }

  return null;
};
