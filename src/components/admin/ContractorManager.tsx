import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Contractor, Project, MaintenanceCategory } from '../../types/database';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  HardHat,
  PlusCircle,
  Mail,
  Phone,
  Layers,
  Building,
  CheckCircle,
  Shield,
} from 'lucide-react';

export const ContractorManager: React.FC = () => {
  const { currentOrg } = useAuth();
  const { showToast } = useNotifications();

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<MaintenanceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cnts, projs, cats] = await Promise.all([
        api.getContractors(currentOrg.id),
        api.getProjects(currentOrg.id),
        api.getCategories(currentOrg.id),
      ]);
      setContractors(cnts);
      setProjects(projs);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="w-5 h-5 text-indigo-600" /> Maintenance Contractors & Service Mapping
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized vendors, trade specializations, and category mappings ready for automated assignment in Version 2.
          </p>
        </div>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contractors.map(cnt => (
          <div
            key={cnt.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 hover:border-indigo-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{cnt.company_name}</h3>
                <p className="text-xs text-slate-600 font-medium">{cnt.contact_name}</p>
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Vendor
              </span>
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{cnt.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{cnt.phone}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Trade Categories:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cnt.service_categories.map(cat => (
                  <span
                    key={cat}
                    className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-indigo-200"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Assignment Status:</span>
              <span className="text-emerald-700 font-semibold">Eligible for Auto & Manual</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
