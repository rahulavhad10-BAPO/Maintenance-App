import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { mockStorage } from './mockStorage';
import {
  Organization,
  Project,
  Building,
  Flat,
  FlatResident,
  MaintenanceCategory,
  Contractor,
  Complaint,
  SiteVisit,
  Quotation,
  CoverageResult,
  NotificationLog,
  WorkflowEvent,
} from '../types/database';

export const api = {
  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('organizations').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getOrganizations();
  },

  // Projects
  async getProjects(orgId?: string): Promise<Project[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('projects').select('*').order('name');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getProjects(orgId);
  },

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      if (error) throw error;
      return data;
    }
    return mockStorage.createProject(project);
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return mockStorage.updateProject(id, updates);
  },

  // Buildings & Flats
  async getBuildings(projectId?: string): Promise<Building[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('buildings').select('*').order('name');
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getBuildings(projectId);
  },

  async getFlats(buildingId?: string): Promise<Flat[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('flats').select('*, project:projects(*), building:buildings(*)').order('flat_number');
      if (buildingId) query = query.eq('building_id', buildingId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getFlats(buildingId);
  },

  async createFlat(data: {
    organization_id: string;
    project_id: string;
    building_id: string;
    flat_number: string;
    floor_number: number;
    possession_date: string;
  }): Promise<Flat> {
    if (isSupabaseConfigured() && supabase) {
      const { data: flat, error } = await supabase.from('flats').insert(data).select().single();
      if (error) throw error;
      return flat;
    }
    return mockStorage.createFlat(data);
  },

  async getResidentFlats(residentId: string): Promise<(Flat & { is_primary_owner: boolean })[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('flat_residents')
        .select('is_primary_owner, flat:flats(*, project:projects(*), building:buildings(*))')
        .eq('resident_id', residentId)
        .eq('link_status', 'active');
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row.flat,
        is_primary_owner: row.is_primary_owner,
      }));
    }
    return mockStorage.getFlatsForResident(residentId);
  },

  async linkResidentToFlat(flatId: string, residentId: string, isPrimary = true): Promise<FlatResident> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('flat_residents')
        .insert({ flat_id: flatId, resident_id: residentId, is_primary_owner: isPrimary, link_status: 'active' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return mockStorage.linkResidentToFlat(flatId, residentId, isPrimary);
  },

  // Categories & Contractors
  async getCategories(orgId?: string): Promise<MaintenanceCategory[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('maintenance_categories').select('*').order('name');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getCategories(orgId);
  },

  async getContractors(orgId?: string): Promise<Contractor[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('contractors').select('*').order('company_name');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getContractors(orgId);
  },

  // Complaints
  async getComplaints(filter?: {
    organizationId?: string;
    residentId?: string;
    contractorUserId?: string;
    status?: string;
    projectId?: string;
  }): Promise<Complaint[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          project:projects(*),
          building:buildings(*),
          flat:flats(*),
          resident:profiles(*),
          category:maintenance_categories(*),
          contractor:contractors(*),
          site_visits(*),
          quotations(*),
          activity_logs:complaint_activity_logs(*)
        `)
        .order('created_at', { ascending: false });

      if (filter?.organizationId) query = query.eq('organization_id', filter.organizationId);
      if (filter?.residentId) query = query.eq('resident_id', filter.residentId);
      if (filter?.status) query = query.eq('status', filter.status);
      if (filter?.projectId) query = query.eq('project_id', filter.projectId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return mockStorage.getComplaints(filter);
  },

  async getComplaintById(id: string): Promise<Complaint | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          project:projects(*),
          building:buildings(*),
          flat:flats(*),
          resident:profiles(*),
          category:maintenance_categories(*),
          contractor:contractors(*),
          site_visits(*),
          quotations(*),
          activity_logs:complaint_activity_logs(*)
        `)
        .eq('id', id)
        .single();
      if (error) return undefined;
      return data;
    }
    return mockStorage.getComplaintById(id);
  },

  async createComplaint(params: Parameters<typeof mockStorage.createComplaint>[0]): Promise<Complaint> {
    return mockStorage.createComplaint(params);
  },

  async assignContractor(
    complaintId: string,
    contractorId: string,
    actor: { id: string; name: string; role: string },
    notes?: string
  ): Promise<Complaint> {
    return mockStorage.assignContractor(complaintId, contractorId, actor, notes);
  },

  async recordSiteVisit(params: Parameters<typeof mockStorage.recordSiteVisit>[0]): Promise<SiteVisit> {
    return mockStorage.recordSiteVisit(params);
  },

  async submitQuotation(params: Parameters<typeof mockStorage.submitQuotation>[0]): Promise<Quotation> {
    return mockStorage.submitQuotation(params);
  },

  async reviewQuotation(params: Parameters<typeof mockStorage.reviewQuotation>[0]): Promise<Quotation> {
    return mockStorage.reviewQuotation(params);
  },

  async updateWorkStatus(params: Parameters<typeof mockStorage.updateWorkStatus>[0]): Promise<Complaint> {
    return mockStorage.updateWorkStatus(params);
  },

  async submitCompletionEvidence(
    params: Parameters<typeof mockStorage.submitCompletionEvidence>[0]
  ): Promise<Complaint> {
    return mockStorage.submitCompletionEvidence(params);
  },

  async residentConfirmOrReopen(
    params: Parameters<typeof mockStorage.residentConfirmOrReopen>[0]
  ): Promise<Complaint> {
    return mockStorage.residentConfirmOrReopen(params);
  },

  async overrideCoverage(
    params: Parameters<typeof mockStorage.overrideCoverage>[0]
  ): Promise<Complaint> {
    return mockStorage.overrideCoverage(params);
  },

  // Notifications
  async getNotifications(userId: string): Promise<NotificationLog[]> {
    return mockStorage.getNotifications(userId);
  },

  async markNotificationRead(id: string): Promise<void> {
    mockStorage.markNotificationAsRead(id);
  },

  // Automation events
  async getWorkflowEvents(orgId?: string): Promise<WorkflowEvent[]> {
    return mockStorage.getWorkflowEvents(orgId);
  },

  resetDemoData(): void {
    mockStorage.resetToDefault();
  },
};
