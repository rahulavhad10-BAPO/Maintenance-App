export type UserRole = 'super_admin' | 'builder_admin' | 'receptionist' | 'contractor' | 'resident';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type SourceChannel = 'web_portal' | 'admin_entry' | 'whatsapp';

export type CoverageResult = 'within_coverage' | 'outside_coverage' | 'coverage_review_required';

export type ComplaintStatus =
  | 'new'
  | 'under_review'
  | 'awaiting_assignment'
  | 'assigned'
  | 'visit_scheduled'
  | 'inspection_completed'
  | 'awaiting_quotation'
  | 'quotation_submitted'
  | 'awaiting_approval'
  | 'revision_requested'
  | 'authorized_to_proceed'
  | 'work_in_progress'
  | 'on_hold'
  | 'work_completed'
  | 'awaiting_resident_confirmation'
  | 'closed'
  | 'out_of_scope';

export type QuotationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'awaiting_approval'
  | 'approved'
  | 'approved_under_threshold'
  | 'rejected'
  | 'revision_requested'
  | 'withdrawn';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_super_admin: boolean;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country: string;
  default_currency: string;
  time_zone: string;
  free_maintenance_duration_months: number;
  quotation_approval_threshold: number;
  all_quotations_require_approval: boolean;
  covered_categories: string[];
  excluded_categories: string[];
  is_active: boolean;
  created_at: string;
}

export interface Building {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  total_floors: number;
  is_active: boolean;
  created_at: string;
  project?: Project;
}

export interface Flat {
  id: string;
  organization_id: string;
  project_id: string;
  building_id: string;
  flat_number: string;
  floor_number: number;
  possession_date: string;
  calculated_maintenance_end_date: string;
  is_active: boolean;
  created_at: string;
  project?: Project;
  building?: Building;
}

export interface FlatResident {
  id: string;
  organization_id: string;
  flat_id: string;
  resident_id: string;
  is_primary_owner: boolean;
  link_status: 'active' | 'pending_verification' | 'revoked';
  linked_at: string;
  flat?: Flat;
  resident?: Profile;
}

export interface MaintenanceCategory {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface Contractor {
  id: string;
  organization_id: string;
  user_id?: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  service_categories: string[];
  eligible_project_ids: string[];
  is_assignment_eligible: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ComplaintAttachment {
  id: string;
  organization_id: string;
  complaint_id: string;
  uploader_id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  storage_path: string;
  bucket_name: string;
  is_completion_evidence: boolean;
  is_voice_note: boolean;
  created_at: string;
}

export interface SiteVisit {
  id: string;
  organization_id: string;
  complaint_id: string;
  contractor_id: string;
  scheduled_at: string;
  visited_at?: string;
  inspection_findings?: string;
  work_required?: string;
  materials_required?: string;
  estimated_completion_hours?: number;
  quotation_required: boolean;
  notes?: string;
  created_at: string;
  contractor?: Contractor;
}

export interface Quotation {
  id: string;
  organization_id: string;
  complaint_id: string;
  contractor_id: string;
  quotation_number: string;
  labour_charges: number;
  material_costs: number;
  taxes: number;
  other_charges: number;
  total_amount: number;
  currency: string;
  work_description: string;
  estimated_duration_days: number;
  quotation_file_path?: string;
  expiry_date?: string;
  version: number;
  status: QuotationStatus;
  threshold_applied?: number;
  created_at: string;
  contractor?: Contractor;
  approvals?: QuotationApproval[];
}

export interface QuotationApproval {
  id: string;
  organization_id: string;
  quotation_id: string;
  approver_id: string;
  decision: 'approved' | 'approved_under_threshold' | 'rejected' | 'revision_requested';
  decision_reason?: string;
  threshold_applied: number;
  policy_notes?: string;
  created_at: string;
  approver?: Profile;
}

export interface ComplaintActivityLog {
  id: string;
  organization_id: string;
  complaint_id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Complaint {
  id: string;
  organization_id: string;
  complaint_reference: string;
  project_id: string;
  building_id: string;
  flat_id: string;
  resident_id: string;
  title: string;
  description: string;
  category_id: string;
  subcategory?: string;
  priority: PriorityLevel;
  source_channel: SourceChannel;
  coverage_result: CoverageResult;
  coverage_override_reason?: string;
  coverage_overridden_by?: string;
  coverage_overridden_at?: string;
  status: ComplaintStatus;
  out_of_scope_reason?: string;
  assigned_contractor_id?: string;
  preferred_visit_time?: string;
  completed_at?: string;
  completion_notes?: string;
  resident_confirmed_at?: string;
  resident_feedback_rating?: number;
  resident_remarks?: string;
  reopened_at?: string;
  reopen_reason?: string;
  created_at: string;
  updated_at: string;

  // Joined relations
  project?: Project;
  building?: Building;
  flat?: Flat;
  resident?: Profile;
  category?: MaintenanceCategory;
  contractor?: Contractor;
  attachments?: ComplaintAttachment[];
  site_visits?: SiteVisit[];
  quotations?: Quotation[];
  activity_logs?: ComplaintActivityLog[];
}

export interface NotificationLog {
  id: string;
  organization_id: string;
  recipient_id: string;
  title: string;
  message: string;
  notification_type: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  complaint_id?: string;
  is_read: boolean;
  delivery_status: 'pending' | 'delivered' | 'failed';
  created_at: string;
}

export interface WorkflowEvent {
  id: string;
  organization_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  retry_count: number;
  error_details?: string;
  created_at: string;
  processed_at?: string;
}
