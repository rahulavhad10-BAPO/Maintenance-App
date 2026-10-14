import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Organization, UserRole } from '../types/database';
import { mockStorage } from '../services/mockStorage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface DemoPersona {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  userId: string;
  description: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'builder_admin',
    title: 'Builder Admin (Manager)',
    name: 'Vikram Malhotra',
    email: 'admin@apexhorizon.com',
    userId: '00000000-0000-0000-0000-000000000002',
    description: 'Manages all projects, coverage, contractor assignments & quotation approvals',
  },
  {
    role: 'resident',
    title: 'Resident (Flat Owner)',
    name: 'Rahul Verma',
    email: 'rahul.resident@gmail.com',
    userId: '00000000-0000-0000-0000-000000000005',
    description: 'Owns flat A-402, submits complaints, confirms completions & rates service',
  },
  {
    role: 'contractor',
    title: 'Contractor (Vendor)',
    name: 'Rajesh Kumar',
    email: 'contractor@voltpro.com',
    userId: '00000000-0000-0000-0000-000000000004',
    description: 'VoltPro Electricals: views assigned jobs, logs visits, submits quotations & completion proof',
  },
  {
    role: 'receptionist',
    title: 'Receptionist (Helpdesk)',
    name: 'Ananya Sharma',
    email: 'receptionist@apexhorizon.com',
    userId: '00000000-0000-0000-0000-000000000003',
    description: 'Registers phone complaints, schedules follow-ups, no quotation approval permission',
  },
  {
    role: 'super_admin',
    title: 'Super Admin (Platform)',
    name: 'Alex Mercer',
    email: 'superadmin@antigravity.dev',
    userId: '00000000-0000-0000-0000-000000000001',
    description: 'Multi-tenant master administrator configuring organizations',
  },
];

interface AuthContextType {
  currentUser: Profile;
  currentOrg: Organization;
  currentRole: UserRole;
  isLiveSupabase: boolean;
  switchPersona: (persona: DemoPersona) => void;
  switchOrganization: (orgId: string) => void;
  signOut: () => Promise<void>;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0]); // default Builder Admin
  const [currentOrgId, setCurrentOrgId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const isLive = isSupabaseConfigured();

  const orgs = mockStorage.getOrganizations();
  const currentOrg = orgs.find(o => o.id === currentOrgId) || orgs[0];

  const currentUser: Profile = {
    id: currentPersona.userId,
    email: currentPersona.email,
    full_name: currentPersona.name,
    is_super_admin: currentPersona.role === 'super_admin',
    created_at: new Date().toISOString(),
  };

  const switchPersona = (persona: DemoPersona) => {
    setCurrentPersona(persona);
  };

  const switchOrganization = (orgId: string) => {
    setCurrentOrgId(orgId);
  };

  const signOut = async () => {
    if (isLive && supabase) {
      await supabase.auth.signOut();
    }
    // Switch to resident or default
    setCurrentPersona(DEMO_PERSONAS[1]);
  };

  const resetDemoData = () => {
    mockStorage.resetToDefault();
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentOrg,
        currentRole: currentPersona.role,
        isLiveSupabase: isLive,
        switchPersona,
        switchOrganization,
        signOut,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
