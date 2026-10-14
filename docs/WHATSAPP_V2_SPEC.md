# WhatsApp Business Platform Integration Specification (Version 2 Provision)

This document specifies the conversation state machine, identity verification, and database contracts prepared for connecting WhatsApp via n8n in Version 2.

> **Important Note:** WhatsApp delivery is disabled in Version 1. The database tables (`channel_identities`, `channel_conversations`, `channel_messages`) are provisioned so WhatsApp can be enabled in Version 2 without restructuring the core complaint system.

---

## 1. Resident Conversational Flow

```
[Resident sends WhatsApp message to Builder Number]
                     │
                     ▼
[n8n Webhook: Receive message & sender phone number]
                     │
                     ▼
       Is phone registered in channel_identities?
         ├── NO ──► Prompt for One-Time SMS/Email OTP Verification
         └── YES
              │
              ▼
    Retrieve flats linked to verified resident
         ├── 1 Flat Linked ──► Auto-select flat
         └── Multiple Flats ──► Present interactive list:
                                 1. Flat A-402 (Emerald Heights)
                                 2. Flat A-701 (Emerald Heights)
              │
              ▼
   [State: entering_complaint]
   Resident sends description + optional photos/voice
              │
              ▼
   [State: select_category]
   Interactive buttons: Plumbing, Electrical, Leakage, Civil, Other
              │
              ▼
   [Insert into complaints table in Supabase]
   Source channel: 'whatsapp'
   Evaluate Maintenance Coverage
   Generate Reference: CMP-2026-XXXX
              │
              ▼
   [Reply on WhatsApp with Reference & Status Link]
```

---

## 2. Security & Anti-Spoofing Rules

1. **Flat Authorization Guard:**
   - A resident cannot register a complaint for a flat simply by texting a flat number.
   - The sender's phone number must exist in `channel_identities` and map to an authorized `profile_id` linked in `flat_residents`.
2. **Confidentiality:**
   - WhatsApp messages never expose internal contractor quotes, labour markups, or builder profit margins.
   - Status updates sent to WhatsApp contain only resident-facing milestones:
     - "Contractor assigned: HydroFlow Plumbing"
     - "Visit scheduled for tomorrow 11:00 AM"
     - "Work completed. Please reply 1 to confirm satisfaction or 2 if unresolved."
3. **Private Attachment Storage:**
   - Photos uploaded via WhatsApp are received by n8n and uploaded directly to Supabase private bucket `complaints` with signed short-lived URLs.

---

## 3. Database Schema Supporting WhatsApp V2

| Table | Purpose |
|---|---|
| `channel_identities` | Stores verified phone number (E.164 format) mapped to `profiles(id)`. |
| `channel_conversations` | Tracks active conversational state (`idle`, `selecting_flat`, `entering_complaint`, `awaiting_media`) and session expiration. |
| `channel_messages` | Inbound and outbound message logs with external WhatsApp Message ID for duplicate-message protection. |
| `complaints.source_channel` | Identifies complaints raised via `'whatsapp'` vs `'web_portal'` vs `'admin_entry'`. |

---

## 4. Human Handoff Protocol

If the resident's input cannot be categorized, or if the resident asks for immediate escalation:
1. `channel_conversations.current_state` is set to `'human_handoff'`.
2. An alert notification is logged for the Builder Receptionist.
3. The automated bot pauses and informs the resident:
   > *"We have notified our Maintenance Helpdesk coordinator (Ananya Sharma). A team member will assist you directly shortly."*
