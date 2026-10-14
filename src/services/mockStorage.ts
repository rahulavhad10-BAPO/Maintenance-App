import {
  Organization,
  Profile,
  Project,
  Building,
  Flat,
  FlatResident,
  MaintenanceCategory,
  Contractor,
  Complaint,
  SiteVisit,
  Quotation,
  QuotationApproval,
  ComplaintActivityLog,
  NotificationLog,
  WorkflowEvent,
  CoverageResult,
  ComplaintStatus,
} from '../types/database';

const STORAGE_KEY = 'antigravity_maintenance_data_v1';

// Month addition helper handling month ends cleanly
export function calculateMaintenanceEndDate(possessionDateStr: string, durationMonths: number): string {
  const d = new Date(possessionDateStr);
  if (isNaN(d.getTime())) return possessionDateStr;
  
  const currentMonth = d.getMonth();
  d.setMonth(currentMonth + durationMonths);
  
  // Format YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function evaluateCoverage(
  flat: Flat | undefined,
  project: Project | undefined,
  category: MaintenanceCategory | undefined,
  reportedDateStr: string = new Date().toISOString()
): CoverageResult {
  if (!flat || !project || !category) return 'coverage_review_required';

  const reportedDate = new Date(reportedDateStr);
  const endDate = new Date(flat.calculated_maintenance_end_date);

  // Check 1: Exceeded maintenance duration
  if (reportedDate > endDate) {
    return 'outside_coverage';
  }

  // Check 2: Explicitly excluded category
  if (project.excluded_categories && project.excluded_categories.includes(category.name)) {
    return 'outside_coverage';
  }

  // Check 3: Covered category whitelist check (if defined and non-empty)
  if (project.covered_categories && project.covered_categories.length > 0) {
    if (!project.covered_categories.includes(category.name)) {
      return 'coverage_review_required';
    }
  }

  return 'within_coverage';
}

export interface AppState {
  organizations: Organization[];
  profiles: Profile[];
  projects: Project[];
  buildings: Building[];
  flats: Flat[];
  flatResidents: FlatResident[];
  categories: MaintenanceCategory[];
  contractors: Contractor[];
  complaints: Complaint[];
  siteVisits: SiteVisit[];
  quotations: Quotation[];
  quotationApprovals: QuotationApproval[];
  activityLogs: ComplaintActivityLog[];
  notifications: NotificationLog[];
  workflowEvents: WorkflowEvent[];
}

const getInitialData = (): AppState => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const projectId1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const projectId2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const bldgId1 = 'b1111111-1111-1111-1111-111111111111';
  const bldgId2 = 'b2222222-2222-2222-2222-222222222222';
  const flatId1 = 'f1111111-1111-1111-1111-111111111111';
  const flatId2 = 'f2222222-2222-2222-2222-222222222222';
  const flatId3 = 'f3333333-3333-3333-3333-333333333333';
  const residentId = '00000000-0000-0000-0000-000000000005';
  const contractorId1 = 'cnt11111-1111-1111-1111-111111111111';
  const contractorId2 = 'cnt22222-2222-2222-2222-222222222222';
  const adminId = '00000000-0000-0000-0000-000000000002';

  const organizations: Organization[] = [
    {
      id: orgId,
      name: 'Apex Horizon Developers',
      slug: 'apex-horizon',
      contact_email: 'support@apexhorizon.com',
      contact_phone: '+91 98200 11223',
      is_active: true,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Prestige Haven Realty',
      slug: 'prestige-haven',
      contact_email: 'contact@prestigehaven.com',
      contact_phone: '+91 98450 33445',
      is_active: true,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
  ];

  const profiles: Profile[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'superadmin@antigravity.dev',
      full_name: 'Alex Mercer (Platform Admin)',
      phone: '+91 99999 00001',
      is_super_admin: true,
      created_at: new Date().toISOString(),
    },
    {
      id: adminId,
      email: 'admin@apexhorizon.com',
      full_name: 'Vikram Malhotra (Maintenance Manager)',
      phone: '+91 98200 55441',
      is_super_admin: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'receptionist@apexhorizon.com',
      full_name: 'Ananya Sharma (Helpdesk Coordinator)',
      phone: '+91 98200 55442',
      is_super_admin: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'contractor@voltpro.com',
      full_name: 'Rajesh Kumar (VoltPro Solutions)',
      phone: '+91 98111 22334',
      is_super_admin: false,
      created_at: new Date().toISOString(),
    },
    {
      id: residentId,
      email: 'rahul.resident@gmail.com',
      full_name: 'Rahul Verma (Flat Owner)',
      phone: '+91 98765 43210',
      is_super_admin: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      email: 'contractor@hydroflow.com',
      full_name: 'Suresh Patel (HydroFlow Plumbing)',
      phone: '+91 98333 44556',
      is_super_admin: false,
      created_at: new Date().toISOString(),
    },
  ];

  const projects: Project[] = [
    {
      id: projectId1,
      organization_id: orgId,
      name: 'Emerald Heights Luxury Residences',
      code: 'EH-01',
      address: 'Sector 45, Golf Course Extension',
      city: 'Gurugram',
      country: 'India',
      default_currency: 'INR',
      time_zone: 'Asia/Kolkata',
      free_maintenance_duration_months: 24,
      quotation_approval_threshold: 5000.0,
      all_quotations_require_approval: false,
      covered_categories: [
        'Plumbing',
        'Electrical',
        'Civil work and cracks',
        'Waterproofing and leakage',
        'Doors, windows and hardware',
        'Painting and finishing',
      ],
      excluded_categories: ['Structural modifications', 'Third-party installed appliances'],
      is_active: true,
      created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    },
    {
      id: projectId2,
      organization_id: orgId,
      name: 'Skyline Greens Eco-Tower',
      code: 'SG-02',
      address: 'Whitefield Main Road',
      city: 'Bengaluru',
      country: 'India',
      default_currency: 'INR',
      time_zone: 'Asia/Kolkata',
      free_maintenance_duration_months: 12,
      quotation_approval_threshold: 3500.0,
      all_quotations_require_approval: true,
      covered_categories: ['Plumbing', 'Electrical', 'Waterproofing and leakage'],
      excluded_categories: ['Interior decor', 'Furniture wear and tear'],
      is_active: true,
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    },
  ];

  const buildings: Building[] = [
    {
      id: bldgId1,
      organization_id: orgId,
      project_id: projectId1,
      name: 'Tower A - Coral',
      total_floors: 24,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: bldgId2,
      organization_id: orgId,
      project_id: projectId1,
      name: 'Tower B - Amber',
      total_floors: 24,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const flats: Flat[] = [
    {
      id: flatId1,
      organization_id: orgId,
      project_id: projectId1,
      building_id: bldgId1,
      flat_number: 'A-402',
      floor_number: 4,
      possession_date: '2026-01-10',
      calculated_maintenance_end_date: calculateMaintenanceEndDate('2026-01-10', 24),
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: flatId2,
      organization_id: orgId,
      project_id: projectId1,
      building_id: bldgId1,
      flat_number: 'A-701',
      floor_number: 7,
      possession_date: '2025-06-15',
      calculated_maintenance_end_date: calculateMaintenanceEndDate('2025-06-15', 24),
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: flatId3,
      organization_id: orgId,
      project_id: projectId1,
      building_id: bldgId2,
      flat_number: 'B-1204',
      floor_number: 12,
      possession_date: '2023-01-01',
      calculated_maintenance_end_date: calculateMaintenanceEndDate('2023-01-01', 24),
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const flatResidents: FlatResident[] = [
    {
      id: 'fr111111-1111-1111-1111-111111111111',
      organization_id: orgId,
      flat_id: flatId1,
      resident_id: residentId,
      is_primary_owner: true,
      link_status: 'active',
      linked_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'fr222222-2222-2222-2222-222222222222',
      organization_id: orgId,
      flat_id: flatId2,
      resident_id: residentId,
      is_primary_owner: false,
      link_status: 'active',
      linked_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  const categories: MaintenanceCategory[] = [
    { id: 'c1', organization_id: orgId, name: 'Plumbing', slug: 'plumbing', description: 'Pipes, faucets, drain blockage, sanitary fittings', icon: 'droplet', is_active: true },
    { id: 'c2', organization_id: orgId, name: 'Electrical', slug: 'electrical', description: 'Wiring, switchboards, MCB tripping, lighting fixtures', icon: 'zap', is_active: true },
    { id: 'c3', organization_id: orgId, name: 'Civil work and cracks', slug: 'civil-work', description: 'Plaster cracks, tiles debonding, masonry, flooring gaps', icon: 'hammer', is_active: true },
    { id: 'c4', organization_id: orgId, name: 'Waterproofing and leakage', slug: 'waterproofing', description: 'Bathroom seepage, balcony leaks, exterior dampness', icon: 'shield-alert', is_active: true },
    { id: 'c5', organization_id: orgId, name: 'Doors, windows and hardware', slug: 'doors-windows', description: 'Lock mechanism, hinge squeaks, sliding window alignment', icon: 'maximize', is_active: true },
    { id: 'c6', organization_id: orgId, name: 'Painting and finishing', slug: 'painting', description: 'Paint peel-off, surface polish, finishing touch-ups', icon: 'paint-brush', is_active: true },
    { id: 'c7', organization_id: orgId, name: 'Lift and common-area issues', slug: 'common-areas', description: 'Corridor lighting, lift door sensor, lobby access', icon: 'box', is_active: true },
    { id: 'c8', organization_id: orgId, name: 'Other', slug: 'other', description: 'General post-possession complaints', icon: 'help-circle', is_active: true },
  ];

  const contractors: Contractor[] = [
    {
      id: contractorId1,
      organization_id: orgId,
      user_id: '00000000-0000-0000-0000-000000000004',
      company_name: 'VoltPro Electrical Services',
      contact_name: 'Rajesh Kumar',
      email: 'contractor@voltpro.com',
      phone: '+91 98111 22334',
      service_categories: ['Electrical'],
      eligible_project_ids: [projectId1, projectId2],
      is_assignment_eligible: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: contractorId2,
      organization_id: orgId,
      user_id: '00000000-0000-0000-0000-000000000006',
      company_name: 'HydroFlow Plumbing Solutions',
      contact_name: 'Suresh Patel',
      email: 'contractor@hydroflow.com',
      phone: '+91 98333 44556',
      service_categories: ['Plumbing', 'Waterproofing and leakage'],
      eligible_project_ids: [projectId1],
      is_assignment_eligible: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'cnt33333-3333-3333-3333-333333333333',
      organization_id: orgId,
      company_name: 'SturdyBuild Civil & Waterproofing',
      contact_name: 'Mahesh Rathi',
      email: 'mahesh@sturdybuild.in',
      phone: '+91 98444 77889',
      service_categories: ['Civil work and cracks', 'Waterproofing and leakage', 'Painting and finishing'],
      eligible_project_ids: [projectId1],
      is_assignment_eligible: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const complaints: Complaint[] = [
    {
      id: 'cmp-001',
      organization_id: orgId,
      complaint_reference: 'CMP-2026-0001',
      project_id: projectId1,
      building_id: bldgId1,
      flat_id: flatId1,
      resident_id: residentId,
      title: 'Master bathroom sink pipe leaking underneath cabinet',
      description: 'Continuous water dripping from the PVC elbow joint under vanity counter. Water is pooling on the floor.',
      category_id: 'c1',
      subcategory: 'Drainage Pipe Leak',
      priority: 'high',
      source_channel: 'web_portal',
      coverage_result: 'within_coverage',
      status: 'awaiting_assignment',
      preferred_visit_time: 'Weekday mornings after 10 AM',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'cmp-002',
      organization_id: orgId,
      complaint_reference: 'CMP-2026-0002',
      project_id: projectId1,
      building_id: bldgId1,
      flat_id: flatId1,
      resident_id: residentId,
      title: 'Living room circuit breaker tripping repeatedly under load',
      description: 'Main 32A MCB trips when AC and geyser run simultaneously. Sparks observed behind sub-distribution panel.',
      category_id: 'c2',
      subcategory: 'MCB / Distribution Board',
      priority: 'urgent',
      source_channel: 'web_portal',
      coverage_result: 'within_coverage',
      status: 'awaiting_approval',
      assigned_contractor_id: contractorId1,
      preferred_visit_time: 'Immediate',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'cmp-003',
      organization_id: orgId,
      complaint_reference: 'CMP-2026-0003',
      project_id: projectId1,
      building_id: bldgId1,
      flat_id: flatId2,
      resident_id: residentId,
      title: 'Balcony sliding glass door lock stuck & misaligned track',
      description: 'Heavy friction when sliding door; central latch is jammed and cannot be locked from inside.',
      category_id: 'c5',
      subcategory: 'Hardware & Alignment',
      priority: 'medium',
      source_channel: 'web_portal',
      coverage_result: 'within_coverage',
      status: 'work_in_progress',
      assigned_contractor_id: contractorId1,
      preferred_visit_time: 'Any afternoon',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'cmp-004',
      organization_id: orgId,
      complaint_reference: 'CMP-2026-0004',
      project_id: projectId1,
      building_id: bldgId1,
      flat_id: flatId1,
      resident_id: residentId,
      title: 'Kitchen ceiling hairline dampness patch near exhaust duct',
      description: 'Small 1.5 sq ft damp patch on the ceiling gypsum board near chimney duct cutout.',
      category_id: 'c4',
      subcategory: 'Ceiling Seepage',
      priority: 'medium',
      source_channel: 'web_portal',
      coverage_result: 'within_coverage',
      status: 'awaiting_resident_confirmation',
      assigned_contractor_id: contractorId2,
      completed_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      completion_notes: 'Injected waterproof polymer resin around the external exhaust pipe flashing. Sealed gypsum board and primer touch-up completed.',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: 'cmp-005',
      organization_id: orgId,
      complaint_reference: 'CMP-2026-0005',
      project_id: projectId1,
      building_id: bldgId2,
      flat_id: flatId3,
      resident_id: residentId,
      title: 'Water pressure low in guest shower',
      description: 'Noticeable drop in shower water pressure compared to other taps.',
      category_id: 'c1',
      subcategory: 'Pressure Valve',
      priority: 'low',
      source_channel: 'admin_entry',
      coverage_result: 'outside_coverage', // flat possession 2023 -> 24m ended 2025
      coverage_override_reason: 'Goodwill maintenance approval granted by Builder Director for flagship customer.',
      coverage_overridden_by: adminId,
      coverage_overridden_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      status: 'closed',
      assigned_contractor_id: contractorId2,
      completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      resident_confirmed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      resident_feedback_rating: 5,
      resident_remarks: 'Resolved swiftly and politely despite being post warranty. Highly appreciate the builder!',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const siteVisits: SiteVisit[] = [
    {
      id: 'sv-001',
      organization_id: orgId,
      complaint_id: 'cmp-002',
      contractor_id: contractorId1,
      scheduled_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      visited_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      inspection_findings: 'Discovered melted insulation on 6sq mm copper wire inside distribution panel. Main 32A breaker contacts pitted due to continuous arcing.',
      work_required: 'Replace 4-pole isolator, rewire 6sq mm busbar connections, perform megger insulation test.',
      materials_required: 'Schneider 32A 4P isolator, 6 sq mm heat-resistant wires, copper busbar links',
      estimated_completion_hours: 4.5,
      quotation_required: true,
      notes: 'Quotation prepared immediately due to high material costs.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'sv-002',
      organization_id: orgId,
      complaint_id: 'cmp-003',
      contractor_id: contractorId1,
      scheduled_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      visited_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      inspection_findings: 'Lower steel roller wheels deformed. Dust accumulation in bottom track causing misalignment.',
      work_required: 'Replace roller sets and realign track.',
      materials_required: 'Heavy-duty brass rollers (2 pairs), industrial lubricant.',
      estimated_completion_hours: 2,
      quotation_required: true,
      notes: 'Small repair, under project threshold.',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const quotations: Quotation[] = [
    {
      id: 'q-002',
      organization_id: orgId,
      complaint_id: 'cmp-002',
      contractor_id: contractorId1,
      quotation_number: 'QUO-2026-0104',
      labour_charges: 2500,
      material_costs: 4200,
      taxes: 800,
      other_charges: 300,
      total_amount: 7800,
      currency: 'INR',
      work_description: 'Replace damaged 32A Schneider 4-pole isolator, rewiring of 6sq mm burnt copper leads, load balancing test.',
      estimated_duration_days: 2,
      status: 'awaiting_approval',
      threshold_applied: 5000,
      version: 1,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'q-003',
      organization_id: orgId,
      complaint_id: 'cmp-003',
      contractor_id: contractorId1,
      quotation_number: 'QUO-2026-0098',
      labour_charges: 1200,
      material_costs: 1800,
      taxes: 400,
      other_charges: 0,
      total_amount: 3400,
      currency: 'INR',
      work_description: 'Precision roller replacement (2 sets) and brass track realigning with silicone lubricator.',
      estimated_duration_days: 1,
      status: 'approved_under_threshold',
      threshold_applied: 5000,
      version: 1,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  const quotationApprovals: QuotationApproval[] = [
    {
      id: 'qa-003',
      organization_id: orgId,
      quotation_id: 'q-003',
      approver_id: adminId,
      decision: 'approved_under_threshold',
      decision_reason: 'Amount (3,400 INR) is below project threshold (5,000 INR). Scope matches verified warranty items.',
      threshold_applied: 5000,
      policy_notes: 'Automatic threshold policy applied.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  const activityLogs: ComplaintActivityLog[] = [
    {
      id: 'log-1',
      organization_id: orgId,
      complaint_id: 'cmp-001',
      actor_id: residentId,
      actor_name: 'Rahul Verma',
      actor_role: 'resident',
      action: 'complaint_created',
      old_status: undefined,
      new_status: 'new',
      notes: 'Complaint submitted via Resident Portal for flat A-402 (within active 24m warranty).',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'log-2',
      organization_id: orgId,
      complaint_id: 'cmp-002',
      actor_id: adminId,
      actor_name: 'Vikram Malhotra',
      actor_role: 'builder_admin',
      action: 'contractor_assigned',
      old_status: 'new',
      new_status: 'assigned',
      notes: 'Assigned to VoltPro Electrical Services.',
      created_at: new Date(Date.now() - 3.5 * 86400000).toISOString(),
    },
    {
      id: 'log-3',
      organization_id: orgId,
      complaint_id: 'cmp-002',
      actor_id: '00000000-0000-0000-0000-000000000004',
      actor_name: 'Rajesh Kumar',
      actor_role: 'contractor',
      action: 'quotation_submitted',
      old_status: 'inspection_completed',
      new_status: 'awaiting_approval',
      notes: 'Quotation #QUO-2026-0104 submitted for 7,800 INR. Strictly exceeds threshold (5,000 INR). Admin approval required.',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'log-4',
      organization_id: orgId,
      complaint_id: 'cmp-003',
      actor_id: adminId,
      actor_name: 'Vikram Malhotra',
      actor_role: 'builder_admin',
      action: 'quotation_approved_under_threshold',
      old_status: 'awaiting_approval',
      new_status: 'authorized_to_proceed',
      notes: 'Quotation #QUO-2026-0098 of 3,400 INR is at or below threshold. Work authorized.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'log-5',
      organization_id: orgId,
      complaint_id: 'cmp-004',
      actor_id: '00000000-0000-0000-0000-000000000006',
      actor_name: 'Suresh Patel',
      actor_role: 'contractor',
      action: 'work_completed',
      old_status: 'work_in_progress',
      new_status: 'awaiting_resident_confirmation',
      notes: 'Work completed with waterproof polymer injection. Photographic proof uploaded.',
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  ];

  const notifications: NotificationLog[] = [
    {
      id: 'notif-1',
      organization_id: orgId,
      recipient_id: adminId,
      title: 'Quotation Exceeds Threshold',
      message: 'Quotation #QUO-2026-0104 (7,800 INR) for Complaint CMP-2026-0002 requires approval (> 5,000 INR threshold).',
      notification_type: 'quotation_approval_required',
      channel: 'in_app',
      complaint_id: 'cmp-002',
      is_read: false,
      delivery_status: 'delivered',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'notif-2',
      organization_id: orgId,
      recipient_id: residentId,
      title: 'Work Completed on CMP-2026-0004',
      message: 'HydroFlow Plumbing has marked repairs as finished. Please inspect and confirm.',
      notification_type: 'work_completed',
      channel: 'in_app',
      complaint_id: 'cmp-004',
      is_read: false,
      delivery_status: 'delivered',
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  ];

  const workflowEvents: WorkflowEvent[] = [
    {
      id: 'evt-001',
      organization_id: orgId,
      event_type: 'complaint.created',
      entity_type: 'complaint',
      entity_id: 'cmp-001',
      payload: {
        complaint_reference: 'CMP-2026-0001',
        category: 'Plumbing',
        project_code: 'EH-01',
        coverage_result: 'within_coverage',
        source_channel: 'web_portal',
      },
      status: 'pending',
      retry_count: 0,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'evt-002',
      organization_id: orgId,
      event_type: 'quotation.submitted',
      entity_type: 'quotation',
      entity_id: 'q-002',
      payload: {
        quotation_number: 'QUO-2026-0104',
        total_amount: 7800,
        threshold_applied: 5000,
        requires_admin_approval: true,
      },
      status: 'processed',
      retry_count: 0,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      processed_at: new Date(Date.now() - 1 * 86400000 + 3000).toISOString(),
    },
  ];

  return {
    organizations,
    profiles,
    projects,
    buildings,
    flats,
    flatResidents,
    categories,
    contractors,
    complaints,
    siteVisits,
    quotations,
    quotationApprovals,
    activityLogs,
    notifications,
    workflowEvents,
  };
};

class MockStorageService {
  private state: AppState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Unable to load stored state from localStorage, falling back to initial data', e);
    }
    const initial = getInitialData();
    this.saveState(initial);
    return initial;
  }

  private saveState(state: AppState): void {
    this.state = state;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public resetToDefault(): AppState {
    const fresh = getInitialData();
    this.saveState(fresh);
    return fresh;
  }

  public getState(): AppState {
    return this.state;
  }

  // Relations & Lookups
  public getOrganizations(): Organization[] {
    return this.state.organizations;
  }

  public getProjects(orgId?: string): Project[] {
    return orgId ? this.state.projects.filter(p => p.organization_id === orgId) : this.state.projects;
  }

  public getProjectById(id: string): Project | undefined {
    return this.state.projects.find(p => p.id === id);
  }

  public getBuildings(projectId?: string): Building[] {
    return projectId ? this.state.buildings.filter(b => b.project_id === projectId) : this.state.buildings;
  }

  public getFlats(buildingId?: string): Flat[] {
    return buildingId ? this.state.flats.filter(f => f.building_id === buildingId) : this.state.flats;
  }

  public getFlatById(id: string): Flat | undefined {
    return this.state.flats.find(f => f.id === id);
  }

  public getCategories(orgId?: string): MaintenanceCategory[] {
    return orgId ? this.state.categories.filter(c => c.organization_id === orgId) : this.state.categories;
  }

  public getContractors(orgId?: string): Contractor[] {
    return orgId ? this.state.contractors.filter(c => c.organization_id === orgId) : this.state.contractors;
  }

  public getFlatsForResident(residentId: string): (Flat & { is_primary_owner: boolean })[] {
    const links = this.state.flatResidents.filter(
      fr => fr.resident_id === residentId && fr.link_status === 'active'
    );
    return links
      .map(link => {
        const flat = this.state.flats.find(f => f.id === link.flat_id);
        if (!flat) return null;
        const project = this.state.projects.find(p => p.id === flat.project_id);
        const building = this.state.buildings.find(b => b.id === flat.building_id);
        return {
          ...flat,
          project,
          building,
          is_primary_owner: link.is_primary_owner,
        };
      })
      .filter(Boolean) as (Flat & { is_primary_owner: boolean })[];
  }

  public getComplaints(filter?: {
    organizationId?: string;
    residentId?: string;
    contractorUserId?: string;
    status?: string;
    projectId?: string;
  }): Complaint[] {
    return this.state.complaints
      .filter(c => {
        if (filter?.organizationId && c.organization_id !== filter.organizationId) return false;
        if (filter?.residentId && c.resident_id !== filter.residentId) return false;
        if (filter?.projectId && c.project_id !== filter.projectId) return false;
        if (filter?.status && c.status !== filter.status) return false;
        if (filter?.contractorUserId) {
          const contractor = this.state.contractors.find(cnt => cnt.user_id === filter.contractorUserId);
          if (!contractor || c.assigned_contractor_id !== contractor.id) return false;
        }
        return true;
      })
      .map(c => this.hydrateComplaint(c));
  }

  public getComplaintById(id: string): Complaint | undefined {
    const raw = this.state.complaints.find(c => c.id === id || c.complaint_reference === id);
    if (!raw) return undefined;
    return this.hydrateComplaint(raw);
  }

  private hydrateComplaint(c: Complaint): Complaint {
    const project = this.state.projects.find(p => p.id === c.project_id);
    const building = this.state.buildings.find(b => b.id === c.building_id);
    const flat = this.state.flats.find(f => f.id === c.flat_id);
    const resident = this.state.profiles.find(p => p.id === c.resident_id);
    const category = this.state.categories.find(cat => cat.id === c.category_id);
    const contractor = this.state.contractors.find(cnt => cnt.id === c.assigned_contractor_id);
    const site_visits = this.state.siteVisits
      .filter(v => v.complaint_id === c.id)
      .map(v => ({
        ...v,
        contractor: this.state.contractors.find(cnt => cnt.id === v.contractor_id),
      }));
    const quotations = this.state.quotations
      .filter(q => q.complaint_id === c.id)
      .map(q => ({
        ...q,
        contractor: this.state.contractors.find(cnt => cnt.id === q.contractor_id),
        approvals: this.state.quotationApprovals.filter(qa => qa.quotation_id === q.id),
      }));
    const activity_logs = this.state.activityLogs
      .filter(log => log.complaint_id === c.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      ...c,
      project,
      building,
      flat,
      resident,
      category,
      contractor,
      site_visits,
      quotations,
      activity_logs,
    };
  }

  // Business Action: Create Complaint
  public createComplaint(params: {
    organization_id: string;
    project_id: string;
    building_id: string;
    flat_id: string;
    resident_id: string;
    title: string;
    description: string;
    category_id: string;
    subcategory?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    preferred_visit_time?: string;
    source_channel?: 'web_portal' | 'admin_entry' | 'whatsapp';
    actorProfile?: Profile;
  }): Complaint {
    const flat = this.state.flats.find(f => f.id === params.flat_id);
    const project = this.state.projects.find(p => p.id === params.project_id);
    const category = this.state.categories.find(c => c.id === params.category_id);

    const coverage = evaluateCoverage(flat, project, category, new Date().toISOString());

    const complaintSeq = this.state.complaints.length + 1;
    const year = new Date().getFullYear();
    const reference = `CMP-${year}-${String(complaintSeq).padStart(4, '0')}`;

    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      organization_id: params.organization_id,
      complaint_reference: reference,
      project_id: params.project_id,
      building_id: params.building_id,
      flat_id: params.flat_id,
      resident_id: params.resident_id,
      title: params.title,
      description: params.description,
      category_id: params.category_id,
      subcategory: params.subcategory,
      priority: params.priority,
      source_channel: params.source_channel || 'web_portal',
      coverage_result: coverage,
      status: 'awaiting_assignment',
      preferred_visit_time: params.preferred_visit_time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newLog: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: params.organization_id,
      complaint_id: newComplaint.id,
      actor_id: params.actorProfile?.id || params.resident_id,
      actor_name: params.actorProfile?.full_name || 'Resident',
      actor_role: params.actorProfile ? (params.actorProfile.is_super_admin ? 'admin' : 'resident') : 'resident',
      action: 'complaint_created',
      new_status: 'awaiting_assignment',
      notes: `Complaint created. Coverage evaluation outcome: ${coverage.replace(/_/g, ' ').toUpperCase()}`,
      created_at: new Date().toISOString(),
    };

    // Idempotent workflow event for n8n
    const newEvent: WorkflowEvent = {
      id: `evt-${Date.now()}`,
      organization_id: params.organization_id,
      event_type: 'complaint.created',
      entity_type: 'complaint',
      entity_id: newComplaint.id,
      payload: {
        complaint_reference: reference,
        title: params.title,
        category: category?.name,
        priority: params.priority,
        coverage_result: coverage,
        flat_number: flat?.flat_number,
        source_channel: params.source_channel || 'web_portal',
      },
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    const updatedComplaints = [newComplaint, ...this.state.complaints];
    const updatedLogs = [newLog, ...this.state.activityLogs];
    const updatedEvents = [newEvent, ...this.state.workflowEvents];

    this.saveState({
      ...this.state,
      complaints: updatedComplaints,
      activityLogs: updatedLogs,
      workflowEvents: updatedEvents,
    });

    return this.hydrateComplaint(newComplaint);
  }

  // Business Action: Manual Contractor Assignment
  public assignContractor(
    complaintId: string,
    contractorId: string,
    actor: { id: string; name: string; role: string },
    notes?: string
  ): Complaint {
    const comp = this.state.complaints.find(c => c.id === complaintId);
    if (!comp) throw new Error('Complaint not found');

    const contractor = this.state.contractors.find(cnt => cnt.id === contractorId);
    if (!contractor) throw new Error('Contractor not found');

    const oldStatus = comp.status;
    const newStatus: ComplaintStatus = 'assigned';

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          assigned_contractor_id: contractorId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: actor.id,
      actor_name: actor.name,
      actor_role: actor.role,
      action: 'contractor_assigned',
      old_status: oldStatus,
      new_status: newStatus,
      notes: notes || `Assigned to contractor ${contractor.company_name} (${contractor.contact_name}).`,
      created_at: new Date().toISOString(),
    };

    // Notification to contractor
    const notif: NotificationLog = {
      id: `notif-${Date.now()}`,
      organization_id: comp.organization_id,
      recipient_id: contractor.user_id || actor.id,
      title: 'New Maintenance Job Assigned',
      message: `You have been assigned to Complaint ${comp.complaint_reference}: "${comp.title}".`,
      notification_type: 'contractor_assigned',
      channel: 'in_app',
      complaint_id: comp.id,
      is_read: false,
      delivery_status: 'delivered',
      created_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
      notifications: [notif, ...this.state.notifications],
    });

    return this.hydrateComplaint({ ...comp, assigned_contractor_id: contractorId, status: newStatus });
  }

  // Business Action: Record Site Visit & Inspection
  public recordSiteVisit(params: {
    complaint_id: string;
    contractor_id: string;
    scheduled_at: string;
    visited_at?: string;
    inspection_findings: string;
    work_required: string;
    materials_required?: string;
    estimated_completion_hours?: number;
    quotation_required: boolean;
    notes?: string;
    actor: { id: string; name: string; role: string };
  }): SiteVisit {
    const comp = this.state.complaints.find(c => c.id === params.complaint_id);
    if (!comp) throw new Error('Complaint not found');

    const newVisit: SiteVisit = {
      id: `sv-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      contractor_id: params.contractor_id,
      scheduled_at: params.scheduled_at,
      visited_at: params.visited_at || new Date().toISOString(),
      inspection_findings: params.inspection_findings,
      work_required: params.work_required,
      materials_required: params.materials_required,
      estimated_completion_hours: params.estimated_completion_hours,
      quotation_required: params.quotation_required,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    const nextStatus: ComplaintStatus = params.quotation_required
      ? 'awaiting_quotation'
      : 'authorized_to_proceed';

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return { ...c, status: nextStatus, updated_at: new Date().toISOString() };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: 'site_visit_inspection_recorded',
      old_status: comp.status,
      new_status: nextStatus,
      notes: `Inspection completed. Quotation required: ${params.quotation_required ? 'YES' : 'NO (Direct fix allowed)'}. Findings: ${params.inspection_findings}`,
      created_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      siteVisits: [newVisit, ...this.state.siteVisits],
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
    });

    return newVisit;
  }

  // Business Action: Submit Quotation & Evaluate Threshold
  public submitQuotation(params: {
    complaint_id: string;
    contractor_id: string;
    labour_charges: number;
    material_costs: number;
    taxes: number;
    other_charges: number;
    work_description: string;
    estimated_duration_days: number;
    actor: { id: string; name: string; role: string };
  }): Quotation {
    const comp = this.state.complaints.find(c => c.id === params.complaint_id);
    if (!comp) throw new Error('Complaint not found');

    const project = this.state.projects.find(p => p.id === comp.project_id);
    const threshold = project?.quotation_approval_threshold ?? 5000;
    const allRequire = project?.all_quotations_require_approval ?? false;

    const total =
      Number(params.labour_charges || 0) +
      Number(params.material_costs || 0) +
      Number(params.taxes || 0) +
      Number(params.other_charges || 0);

    const quoSeq = this.state.quotations.length + 101;
    const quotationNumber = `QUO-${new Date().getFullYear()}-${String(quoSeq).padStart(4, '0')}`;

    // Threshold evaluation rule:
    // Strictly > threshold OR allRequire => awaiting_approval
    // At or below threshold (if no other exceptions) => can be reviewed as approved_under_threshold
    const requiresApproval = total > threshold || allRequire;
    const initialStatus = requiresApproval ? 'awaiting_approval' : 'under_review';
    const nextComplaintStatus: ComplaintStatus = requiresApproval ? 'awaiting_approval' : 'quotation_submitted';

    const newQuotation: Quotation = {
      id: `q-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      contractor_id: params.contractor_id,
      quotation_number: quotationNumber,
      labour_charges: params.labour_charges,
      material_costs: params.material_costs,
      taxes: params.taxes,
      other_charges: params.other_charges,
      total_amount: total,
      currency: project?.default_currency || 'INR',
      work_description: params.work_description,
      estimated_duration_days: params.estimated_duration_days,
      version: 1,
      status: initialStatus,
      threshold_applied: threshold,
      created_at: new Date().toISOString(),
    };

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return { ...c, status: nextComplaintStatus, updated_at: new Date().toISOString() };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: 'quotation_submitted',
      old_status: comp.status,
      new_status: nextComplaintStatus,
      notes: `Quotation ${quotationNumber} submitted for ${total.toLocaleString()} ${project?.default_currency || 'INR'}. Configured Threshold: ${threshold.toLocaleString()}. Requires Admin Approval: ${requiresApproval ? 'YES' : 'NO'}.`,
      created_at: new Date().toISOString(),
    };

    // Notify builder admin if approval is needed
    const admin = this.state.profiles.find(p => !p.is_super_admin && p.email.includes('admin'));
    const notifs = [...this.state.notifications];
    if (admin && requiresApproval) {
      notifs.unshift({
        id: `notif-${Date.now()}`,
        organization_id: comp.organization_id,
        recipient_id: admin.id,
        title: 'Quotation Approval Required',
        message: `Quotation ${quotationNumber} (${total} ${project?.default_currency}) exceeds threshold (${threshold}) for ${comp.complaint_reference}.`,
        notification_type: 'quotation_approval_required',
        channel: 'in_app',
        complaint_id: comp.id,
        is_read: false,
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      });
    }

    // Workflow event for n8n
    const workflowEvent: WorkflowEvent = {
      id: `evt-${Date.now()}`,
      organization_id: comp.organization_id,
      event_type: 'quotation.submitted',
      entity_type: 'quotation',
      entity_id: newQuotation.id,
      payload: {
        quotation_number: quotationNumber,
        total_amount: total,
        threshold_applied: threshold,
        requires_admin_approval: requiresApproval,
        complaint_reference: comp.complaint_reference,
      },
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      quotations: [newQuotation, ...this.state.quotations],
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
      notifications: notifs,
      workflowEvents: [workflowEvent, ...this.state.workflowEvents],
    });

    return newQuotation;
  }

  // Business Action: Admin Review Quotation (Approve, Approve Under Threshold, Reject, Revise)
  public reviewQuotation(params: {
    quotation_id: string;
    decision: 'approved' | 'approved_under_threshold' | 'rejected' | 'revision_requested';
    decision_reason?: string;
    approver: { id: string; name: string; role: string };
  }): Quotation {
    const quo = this.state.quotations.find(q => q.id === params.quotation_id);
    if (!quo) throw new Error('Quotation not found');

    const comp = this.state.complaints.find(c => c.id === quo.complaint_id);
    if (!comp) throw new Error('Associated complaint not found');

    const project = this.state.projects.find(p => p.id === comp.project_id);
    const threshold = project?.quotation_approval_threshold ?? 5000;

    // Validation 1: Contractor cannot approve their own quotation
    const contractor = this.state.contractors.find(cnt => cnt.id === quo.contractor_id);
    if (contractor && contractor.user_id === params.approver.id) {
      throw new Error('Contractors are strictly forbidden from approving their own quotations.');
    }

    // Validation 2: Rejection or revision requires a mandatory reason
    if ((params.decision === 'rejected' || params.decision === 'revision_requested') && (!params.decision_reason || params.decision_reason.trim() === '')) {
      throw new Error('A detailed reason is mandatory when rejecting a quotation or requesting a revision.');
    }

    // Validation 3: Cannot claim approved_under_threshold if amount strictly exceeds threshold
    if (params.decision === 'approved_under_threshold' && quo.total_amount > threshold) {
      throw new Error(`Quotation amount (${quo.total_amount}) strictly exceeds the threshold (${threshold}) and cannot be approved under threshold.`);
    }

    let nextCompStatus: ComplaintStatus = comp.status;
    if (params.decision === 'approved' || params.decision === 'approved_under_threshold') {
      nextCompStatus = 'authorized_to_proceed';
    } else if (params.decision === 'revision_requested') {
      nextCompStatus = 'revision_requested';
    } else if (params.decision === 'rejected') {
      nextCompStatus = 'awaiting_quotation';
    }

    const updatedQuotations = this.state.quotations.map(q => {
      if (q.id === quo.id) {
        return {
          ...q,
          status: params.decision as any,
          updated_at: new Date().toISOString(),
        };
      }
      return q;
    });

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return {
          ...c,
          status: nextCompStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });

    const approvalRecord: QuotationApproval = {
      id: `qa-${Date.now()}`,
      organization_id: comp.organization_id,
      quotation_id: quo.id,
      approver_id: params.approver.id,
      decision: params.decision,
      decision_reason: params.decision_reason,
      threshold_applied: threshold,
      policy_notes: `Evaluated against threshold of ${threshold} ${quo.currency}. Decision: ${params.decision}`,
      created_at: new Date().toISOString(),
    };

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.approver.id,
      actor_name: params.approver.name,
      actor_role: params.approver.role,
      action: `quotation_${params.decision}`,
      old_status: comp.status,
      new_status: nextCompStatus,
      notes: `Quotation ${quo.quotation_number} decision: ${params.decision.replace(/_/g, ' ').toUpperCase()}. Reason: ${params.decision_reason || 'N/A'}.`,
      created_at: new Date().toISOString(),
    };

    // Notify contractor
    const notifs = [...this.state.notifications];
    if (contractor?.user_id) {
      notifs.unshift({
        id: `notif-${Date.now()}`,
        organization_id: comp.organization_id,
        recipient_id: contractor.user_id,
        title: `Quotation ${params.decision.replace(/_/g, ' ').toUpperCase()}`,
        message: `Quotation ${quo.quotation_number} for Complaint ${comp.complaint_reference} was ${params.decision.replace(/_/g, ' ')}.`,
        notification_type: 'quotation_decision',
        channel: 'in_app',
        complaint_id: comp.id,
        is_read: false,
        delivery_status: 'delivered',
        created_at: new Date().toISOString(),
      });
    }

    // Workflow event for n8n
    const workflowEvent: WorkflowEvent = {
      id: `evt-${Date.now()}`,
      organization_id: comp.organization_id,
      event_type: 'quotation.decision',
      entity_type: 'quotation',
      entity_id: quo.id,
      payload: {
        quotation_number: quo.quotation_number,
        decision: params.decision,
        decision_reason: params.decision_reason,
        complaint_reference: comp.complaint_reference,
        next_complaint_status: nextCompStatus,
      },
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      quotations: updatedQuotations,
      complaints: updatedComplaints,
      quotationApprovals: [approvalRecord, ...this.state.quotationApprovals],
      activityLogs: [log, ...this.state.activityLogs],
      notifications: notifs,
      workflowEvents: [workflowEvent, ...this.state.workflowEvents],
    });

    return { ...quo, status: params.decision as any };
  }

  // Business Action: Work Execution Status Update
  public updateWorkStatus(params: {
    complaint_id: string;
    new_status: 'work_in_progress' | 'on_hold' | 'out_of_scope';
    notes: string;
    actor: { id: string; name: string; role: string };
  }): Complaint {
    const comp = this.state.complaints.find(c => c.id === params.complaint_id);
    if (!comp) throw new Error('Complaint not found');

    if (params.new_status === 'out_of_scope' && (!params.notes || params.notes.trim() === '')) {
      throw new Error('A detailed reason is required to mark a complaint out of scope.');
    }

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return {
          ...c,
          status: params.new_status,
          out_of_scope_reason: params.new_status === 'out_of_scope' ? params.notes : c.out_of_scope_reason,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: `status_changed_to_${params.new_status}`,
      old_status: comp.status,
      new_status: params.new_status,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
    });

    return this.hydrateComplaint({ ...comp, status: params.new_status });
  }

  // Business Action: Submit Completion Evidence (Contractor)
  public submitCompletionEvidence(params: {
    complaint_id: string;
    completion_notes: string;
    actor: { id: string; name: string; role: string };
  }): Complaint {
    const comp = this.state.complaints.find(c => c.id === params.complaint_id);
    if (!comp) throw new Error('Complaint not found');

    const nextStatus: ComplaintStatus = 'awaiting_resident_confirmation';
    const completedAt = new Date().toISOString();

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return {
          ...c,
          status: nextStatus,
          completed_at: completedAt,
          completion_notes: params.completion_notes,
          updated_at: completedAt,
        };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: 'work_completed_submitted',
      old_status: comp.status,
      new_status: nextStatus,
      notes: `Contractor marked job completed: "${params.completion_notes}". Awaiting resident sign-off.`,
      created_at: completedAt,
    };

    // Notify resident
    const notifs = [...this.state.notifications];
    notifs.unshift({
      id: `notif-${Date.now()}`,
      organization_id: comp.organization_id,
      recipient_id: comp.resident_id,
      title: 'Work Completed - Please Verify',
      message: `Repairs for ${comp.complaint_reference} are complete. Please verify and confirm satisfaction in the resident portal.`,
      notification_type: 'work_completed',
      channel: 'in_app',
      complaint_id: comp.id,
      is_read: false,
      delivery_status: 'delivered',
      created_at: completedAt,
    });

    this.saveState({
      ...this.state,
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
      notifications: notifs,
    });

    return this.hydrateComplaint({
      ...comp,
      status: nextStatus,
      completed_at: completedAt,
      completion_notes: params.completion_notes,
    });
  }

  // Business Action: Resident Confirmation or Reopening
  public residentConfirmOrReopen(params: {
    complaint_id: string;
    action: 'confirm' | 'reopen';
    remarks: string;
    rating?: number;
    actor: { id: string; name: string; role: string };
  }): Complaint {
    const comp = this.state.complaints.find(c => c.id === params.complaint_id);
    if (!comp) throw new Error('Complaint not found');

    const nextStatus: ComplaintStatus = params.action === 'confirm' ? 'closed' : 'work_in_progress';
    const now = new Date().toISOString();

    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return {
          ...c,
          status: nextStatus,
          resident_confirmed_at: params.action === 'confirm' ? now : undefined,
          resident_feedback_rating: params.rating,
          resident_remarks: params.remarks,
          reopened_at: params.action === 'reopen' ? now : undefined,
          reopen_reason: params.action === 'reopen' ? params.remarks : undefined,
          updated_at: now,
        };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: params.action === 'confirm' ? 'resident_confirmed_and_closed' : 'resident_reopened_complaint',
      old_status: comp.status,
      new_status: nextStatus,
      notes: params.action === 'confirm'
        ? `Resident confirmed repair (Rating: ${params.rating || 5}/5). Remarks: ${params.remarks || 'Confirmed solved.'}`
        : `Resident reported issue unresolved / reopened job. Reason: ${params.remarks}`,
      created_at: now,
    };

    this.saveState({
      ...this.state,
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
    });

    return this.hydrateComplaint({
      ...comp,
      status: nextStatus,
      resident_confirmed_at: params.action === 'confirm' ? now : undefined,
      resident_feedback_rating: params.action === 'confirm' ? params.rating : undefined,
      resident_remarks: params.remarks,
      reopened_at: params.action === 'reopen' ? now : undefined,
    });
  }

  // Business Action: Admin Coverage Override
  public overrideCoverage(params: {
    complaint_id: string;
    new_coverage: CoverageResult;
    reason: string;
    actor: { id: string; name: string; role: string };
  }): Complaint {
    const comp = this.state.complaints.find(c => c.id === params.complaint_id);
    if (!comp) throw new Error('Complaint not found');

    if (!params.reason || params.reason.trim() === '') {
      throw new Error('A mandatory reason is required to override maintenance coverage.');
    }

    const now = new Date().toISOString();
    const updatedComplaints = this.state.complaints.map(c => {
      if (c.id === comp.id) {
        return {
          ...c,
          coverage_result: params.new_coverage,
          coverage_override_reason: params.reason,
          coverage_overridden_by: params.actor.id,
          coverage_overridden_at: now,
          updated_at: now,
        };
      }
      return c;
    });

    const log: ComplaintActivityLog = {
      id: `log-${Date.now()}`,
      organization_id: comp.organization_id,
      complaint_id: comp.id,
      actor_id: params.actor.id,
      actor_name: params.actor.name,
      actor_role: params.actor.role,
      action: 'coverage_overridden',
      notes: `Coverage changed from ${comp.coverage_result} to ${params.new_coverage}. Reason: ${params.reason}`,
      created_at: now,
    };

    this.saveState({
      ...this.state,
      complaints: updatedComplaints,
      activityLogs: [log, ...this.state.activityLogs],
    });

    return this.hydrateComplaint({
      ...comp,
      coverage_result: params.new_coverage,
      coverage_override_reason: params.reason,
    });
  }

  // Admin Project / Flat Management
  public createProject(data: Omit<Project, 'id' | 'created_at'>): Project {
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.saveState({
      ...this.state,
      projects: [...this.state.projects, newProj],
    });
    return newProj;
  }

  public updateProject(id: string, updates: Partial<Project>): Project {
    let updated: Project | undefined;
    const oldProject = this.state.projects.find(p => p.id === id);
    const durationChanged =
      updates.free_maintenance_duration_months !== undefined &&
      updates.free_maintenance_duration_months !== oldProject?.free_maintenance_duration_months;

    const projs = this.state.projects.map(p => {
      if (p.id === id) {
        updated = { ...p, ...updates };
        return updated;
      }
      return p;
    });

    let updatedFlats = this.state.flats;
    // If maintenance duration changed, recalculate all flats for this project
    if (durationChanged && updated) {
      const newDuration = updated.free_maintenance_duration_months;
      updatedFlats = this.state.flats.map(f => {
        if (f.project_id === id) {
          return {
            ...f,
            calculated_maintenance_end_date: calculateMaintenanceEndDate(f.possession_date, newDuration),
          };
        }
        return f;
      });
    }

    if (!updated) throw new Error('Project not found');
    this.saveState({
      ...this.state,
      projects: projs,
      flats: updatedFlats,
    });
    return updated;
  }

  public createFlat(data: {
    organization_id: string;
    project_id: string;
    building_id: string;
    flat_number: string;
    floor_number: number;
    possession_date: string;
  }): Flat {
    const project = this.state.projects.find(p => p.id === data.project_id);
    const duration = project?.free_maintenance_duration_months ?? 24;
    const calculatedEnd = calculateMaintenanceEndDate(data.possession_date, duration);

    const newFlat: Flat = {
      ...data,
      id: `flat-${Date.now()}`,
      calculated_maintenance_end_date: calculatedEnd,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      flats: [...this.state.flats, newFlat],
    });
    return newFlat;
  }

  public linkResidentToFlat(flatId: string, residentId: string, isPrimary = true): FlatResident {
    const flat = this.state.flats.find(f => f.id === flatId);
    if (!flat) throw new Error('Flat not found');

    const link: FlatResident = {
      id: `fr-${Date.now()}`,
      organization_id: flat.organization_id,
      flat_id: flatId,
      resident_id: residentId,
      is_primary_owner: isPrimary,
      link_status: 'active',
      linked_at: new Date().toISOString(),
    };

    this.saveState({
      ...this.state,
      flatResidents: [...this.state.flatResidents, link],
    });
    return link;
  }

  public getNotifications(userId: string): NotificationLog[] {
    return this.state.notifications.filter(n => n.recipient_id === userId);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.state.notifications.map(n => (n.id === id ? { ...n, is_read: true } : n));
    this.saveState({ ...this.state, notifications: notifs });
  }

  public getWorkflowEvents(orgId?: string): WorkflowEvent[] {
    return orgId ? this.state.workflowEvents.filter(e => e.organization_id === orgId) : this.state.workflowEvents;
  }
}

export const mockStorage = new MockStorageService();
