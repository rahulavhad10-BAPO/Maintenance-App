-- ============================================================================
-- 004_seed_data.sql
-- Demonstration Dataset with Realistic Builder Projects, Flats, Users,
-- Contractors, Complaints, Quotations, and Historical Activity Logs
-- ============================================================================

-- 1. Organizations
INSERT INTO organizations (id, name, slug, contact_email, contact_phone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Apex Horizon Developers', 'apex-horizon', 'support@apexhorizon.com', '+91 98200 11223'),
    ('22222222-2222-2222-2222-222222222222', 'Prestige Haven Realty', 'prestige-haven', 'contact@prestigehaven.com', '+91 98450 33445')
ON CONFLICT (id) DO NOTHING;

-- 2. Profiles (Matching Demo Accounts)
INSERT INTO profiles (id, email, full_name, phone, is_super_admin)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'superadmin@antigravity.dev', 'Alex Mercer (Platform Admin)', '+91 99999 00001', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'admin@apexhorizon.com', 'Vikram Malhotra (Maintenance Manager)', '+91 98200 55441', FALSE),
    ('00000000-0000-0000-0000-000000000003', 'receptionist@apexhorizon.com', 'Ananya Sharma (Helpdesk Coordinator)', '+91 98200 55442', FALSE),
    ('00000000-0000-0000-0000-000000000004', 'contractor@voltpro.com', 'Rajesh Kumar (VoltPro Solutions)', '+91 98111 22334', FALSE),
    ('00000000-0000-0000-0000-000000000005', 'rahul.resident@gmail.com', 'Rahul Verma (Flat Owner)', '+91 98765 43210', FALSE),
    ('00000000-0000-0000-0000-000000000006', 'contractor@hydroflow.com', 'Suresh Patel (HydroFlow Plumbing)', '+91 98333 44556', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Organization Members
INSERT INTO organization_members (organization_id, user_id, role)
VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'super_admin'),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'builder_admin'),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 'receptionist'),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 'contractor'),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', 'resident'),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000006', 'contractor')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Projects
INSERT INTO projects (id, organization_id, name, code, address, city, country, default_currency, time_zone, free_maintenance_duration_months, quotation_approval_threshold, all_quotations_require_approval, covered_categories, excluded_categories)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Emerald Heights Luxury Residences', 'EH-01', 'Sector 45, Golf Course Extension', 'Gurugram', 'India', 'INR', 'Asia/Kolkata', 24, 5000.00, FALSE, ARRAY['Plumbing', 'Electrical', 'Civil work and cracks', 'Waterproofing and leakage', 'Doors, windows and hardware', 'Painting and finishing'], ARRAY['Structural modifications', 'Third-party installed appliances']),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Skyline Greens Eco-Tower', 'SG-02', 'Whitefield Main Road', 'Bengaluru', 'India', 'INR', 'Asia/Kolkata', 12, 3500.00, TRUE, ARRAY['Plumbing', 'Electrical', 'Waterproofing and leakage'], ARRAY['Interior decor', 'Furniture wear and tear'])
ON CONFLICT (id) DO NOTHING;

-- 5. Buildings
INSERT INTO buildings (id, organization_id, project_id, name, total_floors)
VALUES
    ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tower A - Coral', 24),
    ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tower B - Amber', 24),
    ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Aspen Block 1', 18)
ON CONFLICT (id) DO NOTHING;

-- 6. Flats (Calculated End Dates: 24 months for Emerald Heights, 12 months for Skyline Greens)
INSERT INTO flats (id, organization_id, project_id, building_id, flat_number, floor_number, possession_date, calculated_maintenance_end_date)
VALUES
    -- Flat 402: Handed over 2026-01-10 -> Maintenance ends 2028-01-10 (Active coverage)
    ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1111111-1111-1111-1111-111111111111', 'A-402', 4, '2026-01-10', '2028-01-10'),
    -- Flat 701: Handed over 2025-06-15 -> Maintenance ends 2027-06-15 (Active coverage)
    ('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1111111-1111-1111-1111-111111111111', 'A-701', 7, '2025-06-15', '2027-06-15'),
    -- Flat 1204: Handed over 2023-01-01 -> Maintenance ends 2025-01-01 (Outside coverage period)
    ('f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b2222222-2222-2222-2222-222222222222', 'B-1204', 12, '2023-01-01', '2025-01-01'),
    -- Flat SG-301: Handed over 2026-03-01 -> Maintenance ends 2027-03-01 (Active coverage)
    ('f4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b3333333-3333-3333-3333-333333333333', 'G-301', 3, '2026-03-01', '2027-03-01')
ON CONFLICT (id) DO NOTHING;

-- 7. Flat Residents (Secure linking of resident account to flat)
INSERT INTO flat_residents (id, organization_id, flat_id, resident_id, is_primary_owner, link_status)
VALUES
    ('fa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', TRUE, 'active'),
    ('fa222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000005', FALSE, 'active')
ON CONFLICT (id) DO NOTHING;

-- 8. Maintenance Categories
INSERT INTO maintenance_categories (id, organization_id, name, slug, description, icon)
VALUES
    ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Plumbing', 'plumbing', 'Pipes, faucets, drain blockage, sanitary fittings', 'droplet'),
    ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Electrical', 'electrical', 'Wiring, switchboards, MCB tripping, lighting fixtures', 'zap'),
    ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Civil work and cracks', 'civil-work', 'Plaster cracks, tiles debonding, masonry, flooring gaps', 'hammer'),
    ('c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Waterproofing and leakage', 'waterproofing', 'Bathroom seepage, balcony leaks, exterior dampness', 'shield-alert'),
    ('c5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Doors, windows and hardware', 'doors-windows', 'Lock mechanism, hinge squeaks, sliding window alignment', 'maximize'),
    ('c6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Painting and finishing', 'painting', 'Paint peel-off, surface polish, finishing touch-ups', 'paint-brush'),
    ('c7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Lift and common-area issues', 'common-areas', 'Corridor lighting, lift door sensor, lobby access', 'box'),
    ('c8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Other', 'other', 'General post-possession complaints', 'help-circle')
ON CONFLICT (id) DO NOTHING;

-- 9. Contractors
INSERT INTO contractors (id, organization_id, user_id, company_name, contact_name, email, phone, service_categories, eligible_project_ids, is_assignment_eligible)
VALUES
    ('ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 'VoltPro Electrical Services', 'Rajesh Kumar', 'contractor@voltpro.com', '+91 98111 22334', ARRAY['Electrical'], ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], TRUE),
    ('ca222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000006', 'HydroFlow Plumbing Solutions', 'Suresh Patel', 'contractor@hydroflow.com', '+91 98333 44556', ARRAY['Plumbing', 'Waterproofing and leakage'], ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::uuid[], TRUE),
    ('ca333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NULL, 'SturdyBuild Civil & Waterproofing', 'Mahesh Rathi', 'mahesh@sturdybuild.in', '+91 98444 77889', ARRAY['Civil work and cracks', 'Waterproofing and leakage', 'Painting and finishing'], ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::uuid[], TRUE)
ON CONFLICT (id) DO NOTHING;

-- 10. Sample Complaints Illustrating the Complete End-to-End Workflow

-- Complaint 1: New Plumbing Complaint (Within Coverage)
INSERT INTO complaints (
    id, organization_id, complaint_reference, project_id, building_id, flat_id, resident_id,
    title, description, category_id, subcategory, priority, source_channel,
    coverage_result, status, preferred_visit_time, created_at
) VALUES (
    'cb111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'CMP-2026-0001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000005',
    'Master bathroom sink pipe leaking underneath cabinet',
    'Continuous water dripping from the PVC elbow joint under the vanity counter. Water is pooling on the tile floor.',
    'c1111111-1111-1111-1111-111111111111',
    'Drainage Pipe Leak',
    'high',
    'web_portal',
    'within_coverage',
    'awaiting_assignment',
    'Weekday mornings after 10 AM',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Complaint 2: Quotation Submitted > Threshold (Requires Admin Approval)
-- Project threshold is 5,000 INR; Quotation total is 7,800 INR -> Requires Approval!
INSERT INTO complaints (
    id, organization_id, complaint_reference, project_id, building_id, flat_id, resident_id,
    title, description, category_id, subcategory, priority, source_channel,
    coverage_result, status, assigned_contractor_id, created_at
) VALUES (
    'cb222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'CMP-2026-0002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000005',
    'Living room circuit breaker tripping repeatedly under load',
    'Main 32A MCB trips when AC and geyser run simultaneously. Sparks observed behind sub-distribution panel.',
    'c2222222-2222-2222-2222-222222222222',
    'MCB / Distribution Board',
    'urgent',
    'web_portal',
    'within_coverage',
    'awaiting_approval',
    'ca111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

-- Quotation for Complaint 2 (Total: 7,800 > 5,000 threshold)
INSERT INTO quotations (
    id, organization_id, complaint_id, contractor_id, quotation_number,
    labour_charges, material_costs, taxes, other_charges, total_amount, currency,
    work_description, estimated_duration_days, status, threshold_applied, created_at
) VALUES (
    'ce222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'cb222222-2222-2222-2222-222222222222',
    'ca111111-1111-1111-1111-111111111111',
    'QUO-2026-0104',
    2500.00,
    4200.00,
    800.00,
    300.00,
    7800.00,
    'INR',
    'Replace damaged 32A Schneider 4-pole isolator, rewiring of 6sq mm burnt copper leads, load balancing test.',
    2,
    'awaiting_approval',
    5000.00,
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Complaint 3: Approved Under Threshold -> Authorized to Proceed
-- Quotation was 3,400 INR (<= 5,000 threshold) -> Marked 'approved_under_threshold'
INSERT INTO complaints (
    id, organization_id, complaint_reference, project_id, building_id, flat_id, resident_id,
    title, description, category_id, subcategory, priority, source_channel,
    coverage_result, status, assigned_contractor_id, created_at
) VALUES (
    'cb333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'CMP-2026-0003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b1111111-1111-1111-1111-111111111111',
    'f2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000005',
    'Balcony sliding glass door lock stuck & misaligned track',
    'Heavy friction when sliding balcony door; central latch is jammed and cannot be locked from inside.',
    'c5555555-5555-5555-5555-555555555555',
    'Hardware & Alignment',
    'medium',
    'web_portal',
    'within_coverage',
    'work_in_progress',
    'ca111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

-- Quotation for Complaint 3 (Total: 3,400 <= 5,000 threshold)
INSERT INTO quotations (
    id, organization_id, complaint_id, contractor_id, quotation_number,
    labour_charges, material_costs, taxes, other_charges, total_amount, currency,
    work_description, estimated_duration_days, status, threshold_applied, created_at
) VALUES (
    'ce333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'cb333333-3333-3333-3333-333333333333',
    'ca111111-1111-1111-1111-111111111111',
    'QUO-2026-0098',
    1200.00,
    1800.00,
    400.00,
    0.00,
    3400.00,
    'INR',
    'Precision roller replacement (2 sets) and brass track realigning with silicone lubricator.',
    1,
    'approved_under_threshold',
    5000.00,
    NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Quotation Approval Record for Complaint 3
INSERT INTO quotation_approvals (
    id, organization_id, quotation_id, approver_id, decision, decision_reason, threshold_applied, policy_notes
) VALUES (
    'ea333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'ce333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000002',
    'approved_under_threshold',
    'Amount is below the 5,000 INR threshold and fully compliant with project warranty scope.',
    5000.00,
    'Automatic threshold authorization policy applied.'
) ON CONFLICT (id) DO NOTHING;

-- Complaint 4: Work Completed -> Awaiting Resident Confirmation
INSERT INTO complaints (
    id, organization_id, complaint_reference, project_id, building_id, flat_id, resident_id,
    title, description, category_id, subcategory, priority, source_channel,
    coverage_result, status, assigned_contractor_id, completed_at, completion_notes, created_at
) VALUES (
    'cb444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'CMP-2026-0004',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000005',
    'Kitchen ceiling hairline dampness patch near exhaust duct',
    'Small 1.5 sq ft damp patch on the ceiling gypsum board near the chimney duct cutout.',
    'c4444444-4444-4444-4444-444444444444',
    'Ceiling Seepage',
    'medium',
    'web_portal',
    'within_coverage',
    'awaiting_resident_confirmation',
    'ca222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '5 hours',
    'Injected waterproof polymer resin around the external exhaust pipe flashing. Gypsum patch sealed and touch-up primer applied.',
    NOW() - INTERVAL '8 days'
) ON CONFLICT (id) DO NOTHING;

-- Activity Logs for Audit History
INSERT INTO complaint_activity_logs (
    organization_id, complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, notes, created_at
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'cb111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', 'Rahul Verma', 'resident', 'complaint_created', NULL, 'new', 'Complaint submitted via Resident Portal. Verified flat A-402 is within active 24-month maintenance period.', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111111', 'cb222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'Vikram Malhotra', 'builder_admin', 'contractor_assigned', 'new', 'assigned', 'Assigned to VoltPro Electrical Services.', NOW() - INTERVAL '3 days'),
    ('11111111-1111-1111-1111-111111111111', 'cb222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000004', 'Rajesh Kumar', 'contractor', 'quotation_submitted', 'inspection_completed', 'awaiting_approval', 'Quotation of 7,800 INR submitted. Strictly exceeds project threshold of 5,000 INR -> Sent to Builder Admin queue.', NOW() - INTERVAL '1 day'),
    ('11111111-1111-1111-1111-111111111111', 'cb333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'Vikram Malhotra', 'builder_admin', 'quotation_approved_under_threshold', 'awaiting_approval', 'authorized_to_proceed', 'Approved Under Threshold (3,400 INR <= 5,000 INR). Work authorized to begin.', NOW() - INTERVAL '3 days'),
    ('11111111-1111-1111-1111-111111111111', 'cb444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000006', 'Suresh Patel', 'contractor', 'work_completed', 'work_in_progress', 'awaiting_resident_confirmation', 'Work completed with photographic proof uploaded. Awaiting flat owner sign-off.', NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- In-App Notifications
INSERT INTO notification_logs (
    organization_id, recipient_id, title, message, notification_type, channel, complaint_id, is_read, created_at
) VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Quotation Exceeds Threshold', 'Quotation #QUO-2026-0104 for 7,800 INR requires builder approval (> 5,000 INR threshold).', 'quotation_approval_required', 'in_app', 'cb222222-2222-2222-2222-222222222222', FALSE, NOW() - INTERVAL '1 day'),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', 'Maintenance Work Completed', 'HydroFlow Plumbing has marked repair for Complaint CMP-2026-0004 as finished. Please verify.', 'work_completed', 'in_app', 'cb444444-4444-4444-4444-444444444444', FALSE, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;
