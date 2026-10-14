import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMaintenanceEndDate,
  evaluateCoverage,
  mockStorage,
} from '../services/mockStorage';
import { Flat, Project, MaintenanceCategory } from '../types/database';

describe('1. Maintenance End Date & Possession Calculations', () => {
  it('correctly calculates 24 months free maintenance from possession date', () => {
    const possession = '2026-01-15';
    const duration = 24;
    const endDate = calculateMaintenanceEndDate(possession, duration);
    expect(endDate).toBe('2028-01-15');
  });

  it('correctly calculates 12 months free maintenance from possession date', () => {
    const possession = '2026-06-01';
    const duration = 12;
    const endDate = calculateMaintenanceEndDate(possession, duration);
    expect(endDate).toBe('2027-06-01');
  });

  it('handles leap year handover (e.g. Feb 29, 2024 + 12 months)', () => {
    const possession = '2024-02-29';
    const duration = 12;
    const endDate = calculateMaintenanceEndDate(possession, duration);
    // Non-leap year 2025 -> Feb 28/Mar 1
    expect(endDate).toBeDefined();
    expect(endDate.startsWith('2025')).toBe(true);
  });
});

describe('2. Maintenance Coverage Rule Evaluation', () => {
  const sampleProject: Project = {
    id: 'proj-1',
    organization_id: 'org-1',
    name: 'Test Residency',
    code: 'TR-01',
    country: 'India',
    default_currency: 'INR',
    time_zone: 'Asia/Kolkata',
    free_maintenance_duration_months: 24,
    quotation_approval_threshold: 5000,
    all_quotations_require_approval: false,
    covered_categories: ['Plumbing', 'Electrical'],
    excluded_categories: ['Structural modifications'],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const activeFlat: Flat = {
    id: 'flat-1',
    organization_id: 'org-1',
    project_id: 'proj-1',
    building_id: 'bldg-1',
    flat_number: '101',
    floor_number: 1,
    possession_date: '2026-01-01',
    calculated_maintenance_end_date: '2028-01-01',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const expiredFlat: Flat = {
    ...activeFlat,
    id: 'flat-expired',
    possession_date: '2020-01-01',
    calculated_maintenance_end_date: '2022-01-01',
  };

  const plumbingCategory: MaintenanceCategory = {
    id: 'cat-plumb',
    organization_id: 'org-1',
    name: 'Plumbing',
    slug: 'plumbing',
    is_active: true,
  };

  const excludedCategory: MaintenanceCategory = {
    id: 'cat-struct',
    organization_id: 'org-1',
    name: 'Structural modifications',
    slug: 'structural',
    is_active: true,
  };

  const unlistedCategory: MaintenanceCategory = {
    id: 'cat-other',
    organization_id: 'org-1',
    name: 'Unlisted Work',
    slug: 'unlisted',
    is_active: true,
  };

  it('returns within_coverage when within date period and covered category', () => {
    const outcome = evaluateCoverage(activeFlat, sampleProject, plumbingCategory, '2026-05-01');
    expect(outcome).toBe('within_coverage');
  });

  it('returns outside_coverage when complaint reported date exceeds calculated maintenance end date', () => {
    const outcome = evaluateCoverage(expiredFlat, sampleProject, plumbingCategory, '2026-05-01');
    expect(outcome).toBe('outside_coverage');
  });

  it('returns outside_coverage when category is explicitly in excluded_categories', () => {
    const outcome = evaluateCoverage(activeFlat, sampleProject, excludedCategory, '2026-05-01');
    expect(outcome).toBe('outside_coverage');
  });

  it('returns coverage_review_required when category is not in covered whitelist', () => {
    const outcome = evaluateCoverage(activeFlat, sampleProject, unlistedCategory, '2026-05-01');
    expect(outcome).toBe('coverage_review_required');
  });
});

describe('3. Quotation Threshold & Approval Rules', () => {
  beforeEach(() => {
    mockStorage.resetToDefault();
  });

  it('flags quotation exceeding project threshold for admin approval', () => {
    const state = mockStorage.getState();
    const comp = state.complaints[0];
    const contractor = state.contractors[0];

    const quo = mockStorage.submitQuotation({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      labour_charges: 3000,
      material_costs: 4000, // Total = 7000 > 5000 threshold
      taxes: 0,
      other_charges: 0,
      work_description: 'Major circuit replacement',
      estimated_duration_days: 2,
      actor: { id: contractor.user_id || 'usr', name: contractor.contact_name, role: 'contractor' },
    });

    expect(quo.total_amount).toBe(7000);
    expect(quo.status).toBe('awaiting_approval');
  });

  it('allows approved_under_threshold when amount is <= threshold', () => {
    const state = mockStorage.getState();
    const comp = state.complaints[0];
    const contractor = state.contractors[0];
    const admin = state.profiles.find(p => p.email.includes('admin'))!;

    const quo = mockStorage.submitQuotation({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      labour_charges: 1000,
      material_costs: 1500, // Total = 2500 <= 5000 threshold
      taxes: 200,
      other_charges: 0,
      work_description: 'Minor tap washer replacement',
      estimated_duration_days: 1,
      actor: { id: contractor.user_id || 'usr', name: contractor.contact_name, role: 'contractor' },
    });

    const reviewed = mockStorage.reviewQuotation({
      quotation_id: quo.id,
      decision: 'approved_under_threshold',
      decision_reason: 'Fully compliant with threshold',
      approver: { id: admin.id, name: admin.full_name, role: 'builder_admin' },
    });

    expect(reviewed.status).toBe('approved_under_threshold');
  });

  it('strictly throws error if attempting approved_under_threshold for amount > threshold', () => {
    const state = mockStorage.getState();
    const comp = state.complaints[0];
    const contractor = state.contractors[0];
    const admin = state.profiles.find(p => p.email.includes('admin'))!;

    const quo = mockStorage.submitQuotation({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      labour_charges: 4000,
      material_costs: 5000, // Total = 9000 > 5000 threshold
      taxes: 0,
      other_charges: 0,
      work_description: 'Over-threshold replacement',
      estimated_duration_days: 3,
      actor: { id: contractor.user_id || 'usr', name: contractor.contact_name, role: 'contractor' },
    });

    expect(() => {
      mockStorage.reviewQuotation({
        quotation_id: quo.id,
        decision: 'approved_under_threshold',
        approver: { id: admin.id, name: admin.full_name, role: 'builder_admin' },
      });
    }).toThrowError(/strictly exceeds the threshold/);
  });

  it('strictly requires a reason when rejecting a quotation', () => {
    const state = mockStorage.getState();
    const comp = state.complaints[0];
    const contractor = state.contractors[0];
    const admin = state.profiles.find(p => p.email.includes('admin'))!;

    const quo = mockStorage.submitQuotation({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      labour_charges: 2000,
      material_costs: 1000,
      taxes: 0,
      other_charges: 0,
      work_description: 'Test quote',
      estimated_duration_days: 1,
      actor: { id: contractor.user_id || 'usr', name: contractor.contact_name, role: 'contractor' },
    });

    expect(() => {
      mockStorage.reviewQuotation({
        quotation_id: quo.id,
        decision: 'rejected',
        decision_reason: '', // Empty reason
        approver: { id: admin.id, name: admin.full_name, role: 'builder_admin' },
      });
    }).toThrowError(/detailed reason is mandatory/);
  });

  it('prevents contractor from approving their own quotation', () => {
    const state = mockStorage.getState();
    const comp = state.complaints[0];
    const contractor = state.contractors[0];

    const quo = mockStorage.submitQuotation({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      labour_charges: 1000,
      material_costs: 1000,
      taxes: 0,
      other_charges: 0,
      work_description: 'Self-approval attempt',
      estimated_duration_days: 1,
      actor: { id: contractor.user_id!, name: contractor.contact_name, role: 'contractor' },
    });

    expect(() => {
      mockStorage.reviewQuotation({
        quotation_id: quo.id,
        decision: 'approved',
        approver: { id: contractor.user_id!, name: contractor.contact_name, role: 'contractor' },
      });
    }).toThrowError(/strictly forbidden from approving their own quotations/);
  });
});

describe('4. Complete End-to-End Workflow Execution', () => {
  beforeEach(() => {
    mockStorage.resetToDefault();
  });

  it('completes the 12-step complaint lifecycle from intake to resident confirmation', () => {
    const state = mockStorage.getState();
    const org = state.organizations[0];
    const project = state.projects[0];
    const bldg = state.buildings[0];
    const flat = state.flats[0];
    const resident = state.profiles.find(p => p.email.includes('resident'))!;
    const contractor = state.contractors[0];
    const admin = state.profiles.find(p => p.email.includes('admin'))!;
    const category = state.categories[0];

    // 1 & 2. Resident raises complaint for linked flat
    const comp = mockStorage.createComplaint({
      organization_id: org.id,
      project_id: project.id,
      building_id: bldg.id,
      flat_id: flat.id,
      resident_id: resident.id,
      title: 'Geyser thermostat failure',
      description: 'Water heating stops prematurely and trips breaker',
      category_id: category.id,
      priority: 'high',
      preferred_visit_time: 'Tomorrow 11 AM',
      actorProfile: resident,
    });

    expect(comp.complaint_reference).toMatch(/^CMP-\d{4}-\d{4}$/);
    expect(comp.coverage_result).toBe('within_coverage');
    expect(comp.status).toBe('awaiting_assignment');

    // 3. Admin assigns contractor
    const assignedComp = mockStorage.assignContractor(
      comp.id,
      contractor.id,
      { id: admin.id, name: admin.full_name, role: 'builder_admin' },
      'Assigned to VoltPro'
    );
    expect(assignedComp.status).toBe('assigned');
    expect(assignedComp.assigned_contractor_id).toBe(contractor.id);

    // 4. Contractor records site visit & inspection
    const visit = mockStorage.recordSiteVisit({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      scheduled_at: new Date().toISOString(),
      inspection_findings: 'Thermostat sensor coil burnt out',
      work_required: 'Replace heating element and thermostat',
      materials_required: '2kW element, copper sensor',
      quotation_required: true,
      actor: { id: contractor.user_id!, name: contractor.contact_name, role: 'contractor' },
    });
    expect(visit.inspection_findings).toBe('Thermostat sensor coil burnt out');

    // 5. Contractor submits quotation (below threshold)
    const quo = mockStorage.submitQuotation({
      complaint_id: comp.id,
      contractor_id: contractor.id,
      labour_charges: 800,
      material_costs: 1400, // Total = 2200 <= 5000 threshold
      taxes: 200,
      other_charges: 0,
      work_description: 'Supply and fit 2kW replacement thermostat element',
      estimated_duration_days: 1,
      actor: { id: contractor.user_id!, name: contractor.contact_name, role: 'contractor' },
    });
    expect(quo.total_amount).toBe(2400);

    // 6. Admin approves quotation
    mockStorage.reviewQuotation({
      quotation_id: quo.id,
      decision: 'approved_under_threshold',
      decision_reason: 'Under threshold and verified covered issue',
      approver: { id: admin.id, name: admin.full_name, role: 'builder_admin' },
    });

    // 7. Contractor updates status to work in progress
    const inProgress = mockStorage.updateWorkStatus({
      complaint_id: comp.id,
      new_status: 'work_in_progress',
      notes: 'Parts arrived; technician on site replacing element.',
      actor: { id: contractor.user_id!, name: contractor.contact_name, role: 'contractor' },
    });
    expect(inProgress.status).toBe('work_in_progress');

    // 8. Contractor submits completion evidence
    const completed = mockStorage.submitCompletionEvidence({
      complaint_id: comp.id,
      completion_notes: 'Replaced element, tested water temperature up to 60C, verified no breaker trip.',
      actor: { id: contractor.user_id!, name: contractor.contact_name, role: 'contractor' },
    });
    expect(completed.status).toBe('awaiting_resident_confirmation');

    // 9. Resident confirms completion and closes complaint with rating
    const closed = mockStorage.residentConfirmOrReopen({
      complaint_id: comp.id,
      action: 'confirm',
      remarks: 'Hot water working perfectly. Technician was polite and cleaned up.',
      rating: 5,
      actor: { id: resident.id, name: resident.full_name, role: 'resident' },
    });
    expect(closed.status).toBe('closed');
    expect(closed.resident_feedback_rating).toBe(5);

    // 10. Verify activity logs exist for each lifecycle step
    const finalComp = mockStorage.getComplaintById(comp.id)!;
    expect(finalComp.activity_logs!.length).toBeGreaterThanOrEqual(6);
  });
});
