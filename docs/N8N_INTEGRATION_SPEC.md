# n8n Workflow Automation Specification (Version 2 Preparation)

This document specifies the exact event payloads, idempotent queue tables, and workflow behaviors designed for n8n automation in Version 2.

---

## 1. Architectural Strategy

```
[Web Portal / Admin Entry]
           │
           ▼
[Supabase Database] ────(Triggers / Polling)────► [workflow_events Table]
                                                            │
                                                            ▼
                                                   [n8n Workflow Engine]
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                                  ▼                                                   ▼
                    [Auto-Contractor Assignment]                          [Threshold Notification]
```

- **Independent Operation in Version 1:** The application functions fully without n8n being online.
- **Idempotency Guarantee:** Every row in `workflow_events` has a unique UUID `id`, `event_type`, `entity_type`, and `payload`.
- **Infinite Loop Prevention:** n8n updates should flag `metadata->>'source' = 'n8n'` or use separate status markers so automated database updates do not trigger cyclical events.

---

## 2. Event Contracts

### Workflow A: New Complaint Intake & Automated Contractor Assignment
* **Trigger Event:** `complaint.created`
* **Entity Type:** `complaint`
* **Trigger Condition:** Complaint registered with `status = 'awaiting_assignment'` and `assigned_contractor_id IS NULL`.

#### Payload Contract:
```json
{
  "event_id": "evt-9a8b7c6d-1234-5678-90ab-cdef12345678",
  "organization_id": "11111111-1111-1111-1111-111111111111",
  "complaint_reference": "CMP-2026-0001",
  "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "category_id": "c1111111-1111-1111-1111-111111111111",
  "category_name": "Plumbing",
  "coverage_result": "within_coverage",
  "priority": "high",
  "flat_number": "A-402",
  "source_channel": "web_portal"
}
```

#### n8n Execution Steps:
1. Read `contractor_categories` mapping table matching `category_id` and `project_id`.
2. Query eligible active contractors:
   ```sql
   SELECT contractor_id 
   FROM contractor_categories 
   WHERE category_id = $json.category_id 
     AND (project_id = $json.project_id OR project_id IS NULL)
   ORDER BY priority_order ASC 
   LIMIT 1;
   ```
3. If an eligible contractor is found:
   - Update `complaints` table: `assigned_contractor_id = contractor_id`, `status = 'assigned'`.
   - Insert row in `contractor_assignments`.
   - Insert activity log in `complaint_activity_logs`.
   - Dispatch notification to contractor.
4. If no eligible contractor found:
   - Leave complaint in `awaiting_assignment` with flag `requires_manual_assignment = TRUE`.
5. Mark event as `processed` in `workflow_events`.

---

### Workflow B: Quotation Submitted & Threshold Evaluation
* **Trigger Event:** `quotation.submitted`
* **Entity Type:** `quotation`

#### Payload Contract:
```json
{
  "event_id": "evt-11223344-5566-7788-9900-aabbccddeeff",
  "organization_id": "11111111-1111-1111-1111-111111111111",
  "quotation_id": "q-002",
  "quotation_number": "QUO-2026-0104",
  "complaint_reference": "CMP-2026-0002",
  "total_amount": 7800.00,
  "currency": "INR",
  "threshold_applied": 5000.00,
  "requires_admin_approval": true
}
```

#### n8n Execution Steps:
1. Verify `total_amount > threshold_applied`.
2. Send executive notification (Email or in-app) to builder maintenance manager with deep link to approval modal.
3. Mark event as `processed`.

---

### Workflow C: Quotation Decision Recorded
* **Trigger Event:** `quotation.decision`
* **Entity Type:** `quotation`

#### Payload Contract:
```json
{
  "event_id": "evt-33445566-7788-99aa-bbcc-ddeeff001122",
  "quotation_number": "QUO-2026-0104",
  "decision": "approved",
  "decision_reason": "Authorized by General Manager",
  "complaint_reference": "CMP-2026-0002",
  "next_complaint_status": "authorized_to_proceed"
}
```

#### n8n Execution Steps:
1. If decision is `approved` or `approved_under_threshold`:
   - Notify contractor: "Work authorized to proceed for CMP-2026-0002."
2. If decision is `revision_requested` or `rejected`:
   - Notify contractor with mandatory decision reason.

---

### Workflow D: Overdue Monitoring & SLA Escalation
* **Schedule:** Cron trigger every 6 hours (`0 */6 * * *`).
* **Condition:** Complaint open > 5 days and not closed.

#### Query:
```sql
SELECT c.id, c.complaint_reference, c.created_at, c.status, p.name as project_name, cnt.company_name
FROM complaints c
JOIN projects p ON c.project_id = p.id
LEFT JOIN contractors cnt ON c.assigned_contractor_id = cnt.id
WHERE c.status NOT IN ('closed', 'out_of_scope')
  AND c.created_at < NOW() - INTERVAL '5 days';
```

---

### Workflow E: Daily Builder Summary Digest
* **Schedule:** Daily at 08:00 AM (`0 8 * * *`).
* **Summary Metrics:**
  - Total active complaints
  - Complaints awaiting contractor assignment
  - Quotations awaiting threshold approval
  - Overdue jobs (> 5 days)
  - Work completed awaiting resident confirmation
