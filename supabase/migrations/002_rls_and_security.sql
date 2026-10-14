-- ============================================================================
-- 002_rls_and_security.sql
-- Row Level Security (RLS) & Multi-Tenant Access Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION auth_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_get_user_role(org_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid() AND is_active = TRUE;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth_is_super_admin() THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id 
          AND user_id = auth.uid() 
          AND role IN ('super_admin', 'builder_admin')
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth_is_super_admin() THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id 
          AND user_id = auth.uid() 
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile or org peers"
ON profiles FOR SELECT
USING (
    id = auth.uid() 
    OR auth_is_super_admin()
    OR EXISTS (
        SELECT 1 FROM organization_members m1
        JOIN organization_members m2 ON m1.organization_id = m2.organization_id
        WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
    )
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- 2. Organizations Policies
CREATE POLICY "Super admins view all organizations"
ON organizations FOR ALL
USING (auth_is_super_admin());

CREATE POLICY "Members can view their own organization"
ON organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = organizations.id AND user_id = auth.uid()
    )
);

-- 3. Projects, Buildings, Flats Policies
CREATE POLICY "Org members can view projects"
ON projects FOR SELECT
USING (auth_is_org_member(organization_id));

CREATE POLICY "Admins can manage projects"
ON projects FOR ALL
USING (auth_is_org_admin(organization_id));

CREATE POLICY "Org members can view buildings"
ON buildings FOR SELECT
USING (auth_is_org_member(organization_id));

CREATE POLICY "Admins can manage buildings"
ON buildings FOR ALL
USING (auth_is_org_admin(organization_id));

CREATE POLICY "Residents can view only their linked flats; Admins/Staff can view all org flats"
ON flats FOR SELECT
USING (
    auth_is_org_admin(organization_id)
    OR auth_get_user_role(organization_id) IN ('receptionist')
    OR EXISTS (
        SELECT 1 FROM flat_residents
        WHERE flat_residents.flat_id = flats.id 
          AND flat_residents.resident_id = auth.uid()
          AND flat_residents.link_status = 'active'
    )
);

CREATE POLICY "Admins can manage flats"
ON flats FOR ALL
USING (auth_is_org_admin(organization_id));

-- 4. Flat Residents Linking Policies
CREATE POLICY "Admins and Residents can view flat links"
ON flat_residents FOR SELECT
USING (
    auth_is_org_admin(organization_id)
    OR resident_id = auth.uid()
);

CREATE POLICY "Only Admins can create or update flat links"
ON flat_residents FOR ALL
USING (auth_is_org_admin(organization_id));

-- 5. Maintenance Categories
CREATE POLICY "Everyone in org can view maintenance categories"
ON maintenance_categories FOR SELECT
USING (auth_is_org_member(organization_id));

CREATE POLICY "Admins can manage maintenance categories"
ON maintenance_categories FOR ALL
USING (auth_is_org_admin(organization_id));

-- 6. Contractors Policies
CREATE POLICY "Admins, staff, and contractor themselves can view contractor record"
ON contractors FOR SELECT
USING (
    auth_is_org_admin(organization_id)
    OR auth_get_user_role(organization_id) = 'receptionist'
    OR user_id = auth.uid()
);

CREATE POLICY "Admins can manage contractors"
ON contractors FOR ALL
USING (auth_is_org_admin(organization_id));

-- 7. Complaints Policies
CREATE POLICY "Complaints SELECT Policy"
ON complaints FOR SELECT
USING (
    auth_is_org_admin(organization_id)
    OR auth_get_user_role(organization_id) = 'receptionist'
    -- Resident can only see their own complaints
    OR (auth_get_user_role(organization_id) = 'resident' AND resident_id = auth.uid())
    -- Contractor can only see assigned complaints
    OR (auth_get_user_role(organization_id) = 'contractor' AND EXISTS (
        SELECT 1 FROM contractors 
        WHERE contractors.id = complaints.assigned_contractor_id 
          AND contractors.user_id = auth.uid()
    ))
);

CREATE POLICY "Complaints INSERT Policy"
ON complaints FOR INSERT
WITH CHECK (
    -- Resident must only insert for a flat they are linked to
    (auth_get_user_role(organization_id) = 'resident' AND resident_id = auth.uid() AND EXISTS (
        SELECT 1 FROM flat_residents 
        WHERE flat_residents.flat_id = complaints.flat_id 
          AND flat_residents.resident_id = auth.uid()
          AND flat_residents.link_status = 'active'
    ))
    -- Admins and receptionists can insert on behalf of residents
    OR auth_is_org_admin(organization_id)
    OR auth_get_user_role(organization_id) = 'receptionist'
);

CREATE POLICY "Complaints UPDATE Policy"
ON complaints FOR UPDATE
USING (
    auth_is_org_admin(organization_id)
    OR auth_get_user_role(organization_id) = 'receptionist'
    -- Resident can update only specific fields (e.g., confirmation/feedback) on their own complaint
    OR (auth_get_user_role(organization_id) = 'resident' AND resident_id = auth.uid())
    -- Contractor can update operational status on their assigned complaint
    OR (auth_get_user_role(organization_id) = 'contractor' AND EXISTS (
        SELECT 1 FROM contractors 
        WHERE contractors.id = complaints.assigned_contractor_id 
          AND contractors.user_id = auth.uid()
    ))
);

-- 8. Quotations Policies
CREATE POLICY "Quotations SELECT Policy"
ON quotations FOR SELECT
USING (
    auth_is_org_admin(organization_id)
    -- Contractor can ONLY see their own quotation
    OR (EXISTS (
        SELECT 1 FROM contractors 
        WHERE contractors.id = quotations.contractor_id 
          AND contractors.user_id = auth.uid()
    ))
    -- Residents CANNOT view confidential vendor quotations
);

CREATE POLICY "Quotations INSERT/UPDATE by Contractor"
ON quotations FOR ALL
USING (
    auth_is_org_admin(organization_id)
    OR EXISTS (
        SELECT 1 FROM contractors 
        WHERE contractors.id = quotations.contractor_id 
          AND contractors.user_id = auth.uid()
    )
);

-- 9. Quotation Approvals Policies
CREATE POLICY "Admins can view and create quotation approvals"
ON quotation_approvals FOR ALL
USING (auth_is_org_admin(organization_id));

CREATE POLICY "Contractor can view approvals for their own quotations"
ON quotation_approvals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM quotations q
        JOIN contractors c ON q.contractor_id = c.id
        WHERE q.id = quotation_approvals.quotation_id AND c.user_id = auth.uid()
    )
);

-- 10. Site Visits Policies
CREATE POLICY "Site Visits View"
ON site_visits FOR SELECT
USING (
    auth_is_org_admin(organization_id)
    OR auth_get_user_role(organization_id) = 'receptionist'
    OR EXISTS (
        SELECT 1 FROM contractors 
        WHERE contractors.id = site_visits.contractor_id 
          AND contractors.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM complaints 
        WHERE complaints.id = site_visits.complaint_id 
          AND complaints.resident_id = auth.uid()
    )
);

CREATE POLICY "Site Visits Manage"
ON site_visits FOR ALL
USING (
    auth_is_org_admin(organization_id)
    OR EXISTS (
        SELECT 1 FROM contractors 
        WHERE contractors.id = site_visits.contractor_id 
          AND contractors.user_id = auth.uid()
    )
);

-- 11. Notifications Policies
CREATE POLICY "Users can view and update their own notifications"
ON notification_logs FOR ALL
USING (recipient_id = auth.uid());
