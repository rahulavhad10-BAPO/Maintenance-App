-- ============================================================================
-- 001_initial_schema.sql
-- BUILDER POST-POSSESSION MAINTENANCE MANAGEMENT SYSTEM
-- Multi-tenant schema supporting Organizations, Projects, Buildings, Flats,
-- Complaints, Quotations with Thresholds, Contractors, and Future n8n/WhatsApp V2
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Multi-tenant isolation)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- matches auth.users.id
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Members (Role-based access per organization)
-- Roles: super_admin, builder_admin, receptionist, contractor, resident
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'builder_admin', 'receptionist', 'contractor', 'resident')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 4. Projects (Configurable maintenance duration & quotation approval threshold)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    default_currency VARCHAR(10) DEFAULT 'INR',
    time_zone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    free_maintenance_duration_months INTEGER NOT NULL DEFAULT 24 CHECK (free_maintenance_duration_months >= 0),
    quotation_approval_threshold NUMERIC(12, 2) NOT NULL DEFAULT 5000.00 CHECK (quotation_approval_threshold >= 0),
    all_quotations_require_approval BOOLEAN DEFAULT FALSE,
    covered_categories TEXT[] DEFAULT '{}',
    excluded_categories TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 5. Buildings / Towers
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    total_floors INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- 6. Flats (Calculated maintenance end date based on possession date + project duration)
CREATE TABLE IF NOT EXISTS flats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    flat_number VARCHAR(50) NOT NULL,
    floor_number INTEGER DEFAULT 1,
    possession_date DATE NOT NULL,
    calculated_maintenance_end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(building_id, flat_number)
);

-- 7. Flat Residents (Secure linking of resident account to flat)
CREATE TABLE IF NOT EXISTS flat_residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_primary_owner BOOLEAN DEFAULT TRUE,
    link_status VARCHAR(50) DEFAULT 'active' CHECK (link_status IN ('active', 'pending_verification', 'revoked')),
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES profiles(id),
    UNIQUE(flat_id, resident_id)
);

-- 8. Maintenance Categories
CREATE TABLE IF NOT EXISTS maintenance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'wrench',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- 9. Contractors / Vendors
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    service_categories TEXT[] DEFAULT '{}',
    eligible_project_ids UUID[] DEFAULT '{}',
    is_assignment_eligible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Contractor Category Mapping (For automated n8n matching)
CREATE TABLE IF NOT EXISTS contractor_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES maintenance_categories(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    priority_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contractor_id, category_id, project_id)
);

-- 11. Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    complaint_reference VARCHAR(50) NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE RESTRICT,
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES maintenance_categories(id) ON DELETE RESTRICT,
    subcategory VARCHAR(100),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source_channel VARCHAR(50) NOT NULL DEFAULT 'web_portal' CHECK (source_channel IN ('web_portal', 'admin_entry', 'whatsapp')),
    
    -- Coverage Assessment
    coverage_result VARCHAR(50) NOT NULL CHECK (coverage_result IN ('within_coverage', 'outside_coverage', 'coverage_review_required')),
    coverage_override_reason TEXT,
    coverage_overridden_by UUID REFERENCES profiles(id),
    coverage_overridden_at TIMESTAMPTZ,
    
    -- Status lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new',
        'under_review',
        'awaiting_assignment',
        'assigned',
        'visit_scheduled',
        'inspection_completed',
        'awaiting_quotation',
        'quotation_submitted',
        'awaiting_approval',
        'revision_requested',
        'authorized_to_proceed',
        'work_in_progress',
        'on_hold',
        'work_completed',
        'awaiting_resident_confirmation',
        'closed',
        'out_of_scope'
    )),
    out_of_scope_reason TEXT,
    
    -- Contractor assignment reference
    assigned_contractor_id UUID REFERENCES contractors(id),
    preferred_visit_time VARCHAR(255),
    
    -- Completion and confirmation
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    resident_confirmed_at TIMESTAMPTZ,
    resident_feedback_rating INTEGER CHECK (resident_feedback_rating BETWEEN 1 AND 5),
    resident_remarks TEXT,
    reopened_at TIMESTAMPTZ,
    reopen_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Complaint Attachments (Photos, documents, voice notes)
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES profiles(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(50) NOT NULL DEFAULT 'complaints',
    is_completion_evidence BOOLEAN DEFAULT FALSE,
    is_voice_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Contractor Assignments History
CREATE TABLE IF NOT EXISTS contractor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 14. Site Visits (Contractor records scheduled & actual visits)
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    visited_at TIMESTAMPTZ,
    inspection_findings TEXT,
    work_required TEXT,
    materials_required TEXT,
    estimated_completion_hours NUMERIC(6, 2),
    quotation_required BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Quotations (Configurable threshold approval workflow)
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    quotation_number VARCHAR(100) NOT NULL,
    labour_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    material_costs NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    work_description TEXT NOT NULL,
    estimated_duration_days INTEGER DEFAULT 1,
    quotation_file_path TEXT,
    expiry_date DATE,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'draft',
        'submitted',
        'under_review',
        'awaiting_approval',
        'approved',
        'approved_under_threshold',
        'rejected',
        'revision_requested',
        'withdrawn'
    )),
    threshold_applied NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Quotation Items (Line item breakdown)
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Quotation Approvals (Audit decisions)
CREATE TABLE IF NOT EXISTS quotation_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES profiles(id),
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('approved', 'approved_under_threshold', 'rejected', 'revision_requested')),
    decision_reason TEXT,
    threshold_applied NUMERIC(12, 2) NOT NULL,
    policy_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Complaint Activity Logs (Immutable audit trail)
CREATE TABLE IF NOT EXISTS complaint_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id),
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. In-App and System Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp')),
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    delivery_status VARCHAR(50) DEFAULT 'delivered' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Workflow Events (Idempotent event log for n8n automation)
CREATE TABLE IF NOT EXISTS workflow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'complaint.created', 'quotation.submitted', 'quotation.approved', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'complaint', 'quotation', 'visit'
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 21. Channel Identities (Version 2 WhatsApp preparation)
CREATE TABLE IF NOT EXISTS channel_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    identifier VARCHAR(100) NOT NULL, -- e.g. E.164 phone number: +919876543210
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(20),
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, channel, identifier)
);

-- 22. Channel Conversations (Version 2 WhatsApp session tracking)
CREATE TABLE IF NOT EXISTS channel_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    identity_id UUID NOT NULL REFERENCES channel_identities(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    conversation_reference VARCHAR(100) NOT NULL,
    current_state VARCHAR(50) DEFAULT 'idle', -- 'idle', 'selecting_flat', 'entering_complaint', 'awaiting_media'
    active_flat_id UUID REFERENCES flats(id),
    active_complaint_id UUID REFERENCES complaints(id),
    session_data JSONB DEFAULT '{}'::jsonb,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Channel Messages (Version 2 Inbound/Outbound message log)
CREATE TABLE IF NOT EXISTS channel_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES channel_conversations(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    external_message_id VARCHAR(100),
    message_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'image', 'audio', 'document'
    content TEXT,
    media_url TEXT,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_flats_project ON flats(project_id);
CREATE INDEX IF NOT EXISTS idx_flats_building ON flats(building_id);
CREATE INDEX IF NOT EXISTS idx_flat_residents_resident ON flat_residents(resident_id);
CREATE INDEX IF NOT EXISTS idx_flat_residents_flat ON flat_residents(flat_id);
CREATE INDEX IF NOT EXISTS idx_complaints_org ON complaints(organization_id);
CREATE INDEX IF NOT EXISTS idx_complaints_flat ON complaints(flat_id);
CREATE INDEX IF NOT EXISTS idx_complaints_resident ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_contractor ON complaints(assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_quotations_complaint ON quotations(complaint_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_complaint ON complaint_activity_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_status ON workflow_events(status);
