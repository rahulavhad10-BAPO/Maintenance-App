-- ============================================================================
-- 003_functions_and_triggers.sql
-- Automated Business Logic, Maintenance Date Recalculation, Coverage Evaluator,
-- Quotation Total Consistency, Activity Audit, and Storage Bucket Config
-- ============================================================================

-- 1. Accurate Maintenance End Date Calculation (handles month-end leap years cleanly)
CREATE OR REPLACE FUNCTION calculate_maintenance_end_date(
    p_possession_date DATE,
    p_duration_months INTEGER
) RETURNS DATE AS $$
BEGIN
    RETURN (p_possession_date + (p_duration_months || ' months')::INTERVAL)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger on Flats: Automatically set calculated_maintenance_end_date
CREATE OR REPLACE FUNCTION trg_set_flat_maintenance_end_date()
RETURNS TRIGGER AS $$
DECLARE
    v_duration_months INTEGER;
BEGIN
    SELECT free_maintenance_duration_months INTO v_duration_months
    FROM projects
    WHERE id = NEW.project_id;
    
    IF v_duration_months IS NULL THEN
        v_duration_months := 24; -- default fallback
    END IF;

    NEW.calculated_maintenance_end_date := calculate_maintenance_end_date(NEW.possession_date, v_duration_months);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_flat_maintenance_end_date ON flats;
CREATE TRIGGER set_flat_maintenance_end_date
BEFORE INSERT OR UPDATE OF possession_date, project_id ON flats
FOR EACH ROW
EXECUTE FUNCTION trg_set_flat_maintenance_end_date();

-- 3. Trigger on Projects: Recalculate all flats when project maintenance duration changes
CREATE OR REPLACE FUNCTION trg_recalculate_project_flats_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.free_maintenance_duration_months IS DISTINCT FROM NEW.free_maintenance_duration_months THEN
        UPDATE flats
        SET calculated_maintenance_end_date = calculate_maintenance_end_date(possession_date, NEW.free_maintenance_duration_months)
        WHERE project_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_project_flats_end_date ON projects;
CREATE TRIGGER recalculate_project_flats_end_date
AFTER UPDATE OF free_maintenance_duration_months ON projects
FOR EACH ROW
EXECUTE FUNCTION trg_recalculate_project_flats_end_date();

-- 4. Unique Complaint Reference Generator: CMP-YYYY-XXXX
CREATE OR REPLACE FUNCTION generate_complaint_reference()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT := TO_CHAR(NOW(), 'YYYY');
    v_seq_num BIGINT;
    v_ref TEXT;
BEGIN
    IF NEW.complaint_reference IS NULL OR NEW.complaint_reference = '' THEN
        SELECT COUNT(*) + 1 INTO v_seq_num FROM complaints WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
        v_ref := 'CMP-' || v_year || '-' || LPAD(v_seq_num::TEXT, 4, '0');
        NEW.complaint_reference := v_ref;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_complaint_reference ON complaints;
CREATE TRIGGER set_complaint_reference
BEFORE INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION generate_complaint_reference();

-- 5. Coverage Assessment Function
CREATE OR REPLACE FUNCTION evaluate_complaint_coverage(
    p_flat_id UUID,
    p_category_id UUID,
    p_reported_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR AS $$
DECLARE
    v_end_date DATE;
    v_cat_name VARCHAR;
    v_project_id UUID;
    v_covered_categories TEXT[];
    v_excluded_categories TEXT[];
BEGIN
    SELECT f.calculated_maintenance_end_date, f.project_id, c.name, p.covered_categories, p.excluded_categories
    INTO v_end_date, v_project_id, v_cat_name, v_covered_categories, v_excluded_categories
    FROM flats f
    JOIN projects p ON f.project_id = p.id
    JOIN maintenance_categories c ON c.id = p_category_id
    WHERE f.id = p_flat_id;

    IF v_end_date IS NULL THEN
        RETURN 'coverage_review_required';
    END IF;

    -- Date period check
    IF p_reported_date > v_end_date THEN
        RETURN 'outside_coverage';
    END IF;

    -- Excluded categories check
    IF v_excluded_categories IS NOT NULL AND v_cat_name = ANY(v_excluded_categories) THEN
        RETURN 'outside_coverage';
    END IF;

    -- Specific covered list check (if empty array, all non-excluded are covered)
    IF v_covered_categories IS NOT NULL AND array_length(v_covered_categories, 1) > 0 THEN
        IF NOT (v_cat_name = ANY(v_covered_categories)) THEN
            RETURN 'coverage_review_required';
        END IF;
    END IF;

    RETURN 'within_coverage';
END;
$$ LANGUAGE plpgsql;

-- 6. Quotation Total Auto-Calculator Trigger
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

-- 7. Audit Logging on Complaint Status Changes
CREATE OR REPLACE FUNCTION trg_log_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO complaint_activity_logs (
            organization_id,
            complaint_id,
            actor_id,
            actor_role,
            action,
            old_status,
            new_status,
            notes
        ) VALUES (
            NEW.organization_id,
            NEW.id,
            auth.uid(),
            'system',
            'status_updated',
            OLD.status,
            NEW.status,
            'Status transitioned to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_complaint_status_change ON complaints;
CREATE TRIGGER log_complaint_status_change
AFTER UPDATE OF status ON complaints
FOR EACH ROW
EXECUTE FUNCTION trg_log_complaint_status_change();

-- 8. Supabase Private Storage Buckets Configuration
-- Insert private buckets if storage schema exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES 
            ('complaints', 'complaints', false),
            ('quotations', 'quotations', false),
            ('evidence', 'evidence', false),
            ('voicenotes', 'voicenotes', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
