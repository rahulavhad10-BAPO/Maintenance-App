-- ============================================================================
-- ALL_IN_ONE_SETUP.sql
-- BUILDER POST-POSSESSION MAINTENANCE MANAGEMENT SYSTEM
-- Complete schema, security, triggers, and sample builder data in one script!
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
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Members
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

-- 4. Projects
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

-- 5. Buildings
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

-- 6. Flats
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

-- 7. Flat Residents
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

-- 9. Contractors
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

-- 10. Contractor Categories
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
    coverage_result VARCHAR(50) NOT NULL CHECK (coverage_result IN ('within_coverage', 'outside_coverage', 'coverage_review_required')),
    coverage_override_reason TEXT,
    coverage_overridden_by UUID REFERENCES profiles(id),
    coverage_overridden_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'under_review', 'awaiting_assignment', 'assigned',
        'visit_scheduled', 'inspection_completed', 'awaiting_quotation',
        'quotation_submitted', 'awaiting_approval', 'revision_requested',
        'authorized_to_proceed', 'work_in_progress', 'on_hold',
        'work_completed', 'awaiting_resident_confirmation', 'closed', 'out_of_scope'
    )),
    out_of_scope_reason TEXT,
    assigned_contractor_id UUID REFERENCES contractors(id),
    preferred_visit_time VARCHAR(255),
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

-- 12. Attachments
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

-- 13. Contractor Assignments
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

-- 14. Site Visits
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

-- 15. Quotations
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
        'draft', 'submitted', 'under_review', 'awaiting_approval',
        'approved', 'approved_under_threshold', 'rejected', 'revision_requested', 'withdrawn'
    )),
    threshold_applied NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Quotation Approvals
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

-- 18. Activity Logs
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

-- 19. Notification Logs
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

-- 20. Workflow Events (n8n Idempotent Log)
CREATE TABLE IF NOT EXISTS workflow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 21. WhatsApp Channels (Version 2)
CREATE TABLE IF NOT EXISTS channel_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    identifier VARCHAR(100) NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(20),
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, channel, identifier)
);

CREATE TABLE IF NOT EXISTS channel_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    identity_id UUID NOT NULL REFERENCES channel_identities(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    conversation_reference VARCHAR(100) NOT NULL,
    current_state VARCHAR(50) DEFAULT 'idle',
    active_flat_id UUID REFERENCES flats(id),
    active_complaint_id UUID REFERENCES complaints(id),
    session_data JSONB DEFAULT '{}'::jsonb,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES channel_conversations(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    external_message_id VARCHAR(100),
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGERS & FUNCTIONS
CREATE OR REPLACE FUNCTION calculate_maintenance_end_date(
    p_possession_date DATE,
    p_duration_months INTEGER
) RETURNS DATE AS $$
BEGIN
    RETURN (p_possession_date + (p_duration_months || ' months')::INTERVAL)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION trg_calculate_quotation_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount := COALESCE(NEW.labour_charges, 0) + 
                        COALESCE(NEW.material_costs, 0) + 
                        COALESCE(NEW.taxes, 0) + 
                        COALESCE(NEW.other_charges, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_quotation_total ON quotations;
CREATE TRIGGER calculate_quotation_total
BEFORE INSERT OR UPDATE OF labour_charges, material_costs, taxes, other_charges ON quotations
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_quotation_total();

-- SEED DATA (Organizations, Projects, Flats, Contractors, Categories)
INSERT INTO organizations (id, name, slug, contact_email, contact_phone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Apex Horizon Developers', 'apex-horizon', 'support@apexhorizon.com', '+91 98200 11223'),
    ('22222222-2222-2222-2222-222222222222', 'Prestige Haven Realty', 'prestige-haven', 'contact@prestigehaven.com', '+91 98450 33445')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, phone, is_super_admin)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'superadmin@antigravity.dev', 'Alex Mercer (Platform Admin)', '+91 99999 00001', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'admin@apexhorizon.com', 'Vikram Malhotra (Maintenance Manager)', '+91 98200 55441', FALSE),
    ('00000000-0000-0000-0000-000000000003', 'receptionist@apexhorizon.com', 'Ananya Sharma (Helpdesk Coordinator)', '+91 98200 55442', FALSE),
    ('00000000-0000-0000-0000-000000000004', 'contractor@voltpro.com', 'Rajesh Kumar (VoltPro Solutions)', '+91 98111 22334', FALSE),
    ('00000000-0000-0000-0000-000000000005', 'rahul.resident@gmail.com', 'Rahul Verma (Flat Owner)', '+91 98765 43210', FALSE),
    ('00000000-0000-0000-0000-000000000006', 'contractor@hydroflow.com', 'Suresh Patel (HydroFlow Plumbing)', '+91 98333 44556', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, organization_id, name, code, address, city, country, default_currency, time_zone, free_maintenance_duration_months, quotation_approval_threshold, all_quotations_require_approval, covered_categories, excluded_categories)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Emerald Heights Luxury Residences', 'EH-01', 'Sector 45, Golf Course Extension', 'Gurugram', 'India', 'INR', 'Asia/Kolkata', 24, 5000.00, FALSE, ARRAY['Plumbing', 'Electrical', 'Civil work and cracks', 'Waterproofing and leakage'], ARRAY['Structural modifications']),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Skyline Greens Eco-Tower', 'SG-02', 'Whitefield Main Road', 'Bengaluru', 'India', 'INR', 'Asia/Kolkata', 12, 3500.00, TRUE, ARRAY['Plumbing', 'Electrical'], ARRAY['Interior decor'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, organization_id, project_id, name, total_floors)
VALUES
    ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tower A - Coral', 24),
    ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tower B - Amber', 24)
ON CONFLICT (id) DO NOTHING;

INSERT INTO flats (id, organization_id, project_id, building_id, flat_number, floor_number, possession_date, calculated_maintenance_end_date)
VALUES
    ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1111111-1111-1111-1111-111111111111', 'A-402', 4, '2026-01-10', '2028-01-10'),
    ('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1111111-1111-1111-1111-111111111111', 'A-701', 7, '2025-06-15', '2027-06-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO flat_residents (id, organization_id, flat_id, resident_id, is_primary_owner, link_status)
VALUES
    ('fr111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', TRUE, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO maintenance_categories (id, organization_id, name, slug, description, icon)
VALUES
    ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Plumbing', 'plumbing', 'Pipes, faucets, blockage', 'droplet'),
    ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Electrical', 'electrical', 'Wiring, switchboards, MCB', 'zap'),
    ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Civil work and cracks', 'civil-work', 'Plaster cracks, tiles', 'hammer'),
    ('c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Waterproofing and leakage', 'waterproofing', 'Bathroom seepage, dampness', 'shield-alert')
ON CONFLICT (id) DO NOTHING;

INSERT INTO contractors (id, organization_id, user_id, company_name, contact_name, email, phone, service_categories, eligible_project_ids)
VALUES
    ('cnt11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 'VoltPro Electrical Services', 'Rajesh Kumar', 'contractor@voltpro.com', '+91 98111 22334', ARRAY['Electrical'], ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']),
    ('cnt22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000006', 'HydroFlow Plumbing Solutions', 'Suresh Patel', 'contractor@hydroflow.com', '+91 98333 44556', ARRAY['Plumbing'], ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO complaints (
    id, organization_id, complaint_reference, project_id, building_id, flat_id, resident_id,
    title, description, category_id, priority, source_channel, coverage_result, status, preferred_visit_time
) VALUES (
    'cmp11111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'CMP-2026-0001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000005',
    'Master bathroom sink pipe leaking underneath cabinet',
    'Water dripping from the PVC elbow joint under vanity counter.',
    'c1111111-1111-1111-1111-111111111111',
    'high',
    'web_portal',
    'within_coverage',
    'awaiting_assignment',
    'Weekday mornings after 10 AM'
) ON CONFLICT (id) DO NOTHING;
