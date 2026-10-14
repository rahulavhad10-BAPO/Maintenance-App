import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Flat, MaintenanceCategory, CoverageResult } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { evaluateCoverage } from '../../services/mockStorage';
import { StatusBadge } from '../common/StatusBadge';
import {
  PlusCircle,
  Home,
  CheckCircle,
  Camera,
  Mic,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface RaiseComplaintWizardProps {
  preselectedFlatId?: string;
  onSuccess: (complaintId: string) => void;
  onCancel: () => void;
}

export const RaiseComplaintWizard: React.FC<RaiseComplaintWizardProps> = ({
  preselectedFlatId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, currentOrg, currentRole } = useAuth();
  const { showToast } = useNotifications();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [flats, setFlats] = useState<(Flat & { is_primary_owner: boolean })[]>([]);
  const [categories, setCategories] = useState<MaintenanceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [flatId, setFlatId] = useState(preselectedFlatId || '');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredVisitTime, setPreferredVisitTime] = useState('Weekday mornings after 10 AM');
  
  // Attachments simulation
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userFlats, allCats] = await Promise.all([
        api.getResidentFlats(currentUser.id),
        api.getCategories(currentOrg.id),
      ]);
      setFlats(userFlats);
      setCategories(allCats);
      if (!flatId && userFlats.length > 0) {
        setFlatId(userFlats[0].id);
      }
      if (allCats.length > 0 && !categoryId) {
        setCategoryId(allCats[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedFlat = flats.find(f => f.id === flatId);
  const selectedCat = categories.find(c => c.id === categoryId);
  const coveragePreview: CoverageResult = evaluateCoverage(
    selectedFlat,
    selectedFlat?.project,
    selectedCat,
    new Date().toISOString()
  );

  const handleSimulateRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setHasVoiceNote(true);
      showToast('info', 'Voice Note Recorded', 'Simulated voice description recorded (18s).');
    }, 2000);
  };

  const handleAddSamplePhoto = () => {
    setAttachedFiles(prev => [...prev, `photo_${prev.length + 1}.jpg`]);
    showToast('info', 'Photo Attached', 'Defect photo uploaded successfully.');
  };

  const handleSubmitComplaint = async () => {
    if (!flatId || !categoryId || !title.trim() || !description.trim()) {
      showToast('warning', 'Missing Details', 'Please complete title, category and issue description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createComplaint({
        organization_id: selectedFlat!.organization_id,
        project_id: selectedFlat!.project_id,
        building_id: selectedFlat!.building_id,
        flat_id: flatId,
        resident_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        subcategory: subcategory.trim() || undefined,
        priority,
        preferred_visit_time: preferredVisitTime,
        source_channel: 'web_portal',
        actorProfile: currentUser,
      });

      showToast(
        'success',
        'Complaint Lodged Successfully!',
        `Reference: ${created.complaint_reference}. Outcome: ${created.coverage_result.replace(/_/g, ' ').toUpperCase()}`
      );
      onSuccess(created.id);
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
        Loading flat ownership records...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Wizard Header */}
      <div className="bg-indigo-600 text-white p-6">
        <h1 className="text-xl font-bold tracking-tight">Raise Post-Possession Maintenance Complaint</h1>
        <p className="text-xs text-indigo-100 mt-1">
          Complaints are evaluated automatically under your project's free-warranty duration and assigned to certified vendors.
        </p>

        {/* Step Indicators */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              step >= 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[11px] font-bold">
              1
            </span>
            <span>Select Flat & Warranty</span>
          </div>

          <div
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              step >= 2 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[11px] font-bold">
              2
            </span>
            <span>Issue Details</span>
          </div>

          <div
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              step >= 3 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[11px] font-bold">
              3
            </span>
            <span>Evidence & Submit</span>
          </div>
        </div>
      </div>

      {/* Step Body */}
      <div className="p-6 space-y-6">
        {/* STEP 1: Flat Selection & Warranty Assessment Preview */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Step 1: Choose Your Flat</h2>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select from your authorized linked flats:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flats.map(flat => {
                  const isSelected = flat.id === flatId;
                  return (
                    <div
                      key={flat.id}
                      onClick={() => setFlatId(flat.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-slate-900">Unit {flat.flat_number}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {flat.building?.name} • {flat.project?.name}
                      </p>
                      <div className="mt-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100 flex justify-between">
                        <span>Handover: {flat.possession_date}</span>
                        <span className="font-semibold text-indigo-700">Ends: {flat.calculated_maintenance_end_date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instant Coverage Preview */}
            {selectedFlat && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Maintenance Coverage Assessment:</span>
                  <StatusBadge coverage={coveragePreview} />
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Project <strong>{selectedFlat.project?.name}</strong> provides a {selectedFlat.project?.free_maintenance_duration_months}-month free maintenance period starting from possession ({selectedFlat.possession_date}) until{' '}
                  <strong>{selectedFlat.calculated_maintenance_end_date}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Issue Details */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900">Step 2: Describe the Defect / Issue</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Maintenance Category *:</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subcategory / Specific Component:</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  placeholder="e.g. Basin tap drip, MCB spark, balcony latch..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Severity / Priority *:</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low (Minor cosmetic issue)</option>
                  <option value="medium">Medium (Standard repair)</option>
                  <option value="high">High (Impacting daily use)</option>
                  <option value="urgent">Urgent (Continuous leakage / electrical hazard)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Preferred Contractor Visit Window:</label>
                <input
                  type="text"
                  value={preferredVisitTime}
                  onChange={e => setPreferredVisitTime(e.target.value)}
                  placeholder="e.g. Weekday mornings, Saturday after 2 PM..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Complaint Title *:</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Detailed Description *:</label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe when the issue started, exact location in the flat, and any symptoms..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Photos & Evidence Submission */}
        {step === 3 && (
          <div className="space-y-5 text-xs">
            <h2 className="text-sm font-bold text-slate-900">Step 3: Upload Evidence & Photos</h2>
            <p className="text-slate-500">
              Photos allow the contractor to bring appropriate replacement components and tools for inspection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo Upload Box */}
              <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                <Camera className="w-8 h-8 text-indigo-600 mx-auto" />
                <div>
                  <span className="font-bold text-slate-900 block">Upload Issue Photos</span>
                  <span className="text-[11px] text-slate-400">JPG, PNG up to 10MB (Private Storage Bucket)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddSamplePhoto}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs"
                >
                  + Add Defect Photo
                </button>
                {attachedFiles.length > 0 && (
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                    ✓ {attachedFiles.length} photo(s) staged for secure upload
                  </div>
                )}
              </div>

              {/* Voice Note Simulation Box */}
              <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                <Mic className="w-8 h-8 text-indigo-600 mx-auto" />
                <div>
                  <span className="font-bold text-slate-900 block">Optional Voice Note</span>
                  <span className="text-[11px] text-slate-400">Speak in your language to describe the issue</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateRecording}
                  disabled={isRecording || hasVoiceNote}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs ${
                    hasVoiceNote
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : isRecording
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {hasVoiceNote ? '✓ Voice Note Attached (18s)' : isRecording ? 'Recording audio...' : 'Record Voice Note'}
                </button>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2 text-xs">
              <span className="font-bold text-indigo-950 block">Ready to Lodge Request:</span>
              <div className="text-indigo-900 flex flex-wrap gap-x-4 gap-y-1">
                <span>Unit: <strong>{selectedFlat?.flat_number}</strong></span>
                <span>Category: <strong>{selectedCat?.name}</strong></span>
                <span>Priority: <strong>{priority.toUpperCase()}</strong></span>
                <span>Coverage: <strong className="capitalize">{coveragePreview.replace(/_/g, ' ')}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !flatId) {
                  showToast('warning', 'Flat Required', 'Please select a flat.');
                  return;
                }
                if (step === 2 && (!title.trim() || !description.trim())) {
                  showToast('warning', 'Required Fields', 'Please complete title and description.');
                  return;
                }
                setStep((step + 1) as any);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitComplaint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting to Database...' : 'Submit Maintenance Request'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
