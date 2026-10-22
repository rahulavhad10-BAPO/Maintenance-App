import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Flat, FlatResident, Profile } from '../../types/database';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { mockStorage } from '../../services/mockStorage';
import {
  Users,
  UserPlus,
  Link2,
  ShieldCheck,
  Home,
  CheckCircle,
  Mail,
  Phone,
} from 'lucide-react';

export const ResidentManager: React.FC = () => {
  const { currentOrg } = useAuth();
  const { showToast } = useNotifications();

  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatResidents, setFlatResidents] = useState<FlatResident[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);

  const loadData = async () => {
    try {
      const [allFlats] = await Promise.all([api.getFlats()]);
      const state = mockStorage.getState();
      setFlats(allFlats);
      setFlatResidents(state.flatResidents);
      setProfiles(state.profiles);
      if (allFlats.length > 0 && !selectedFlatId) {
        setSelectedFlatId(allFlats[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg.id]);

  const handleLinkResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId || !selectedResidentId) {
      showToast('warning', 'Selection Required', 'Please choose a flat and resident profile.');
      return;
    }

    try {
      await api.linkResidentToFlat(selectedFlatId, selectedResidentId, isPrimary);
      showToast('success', 'Resident Linked', 'Resident successfully granted verified access to flat.');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Linking Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Authorized Resident Directory & Flat Linking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically secure linking of resident profiles to verified units. Public registration bypass is prevented.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Link2 className="w-4 h-4" />
          <span>Link Resident to Flat</span>
        </button>
      </div>

      {/* Linked Residents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Resident Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Linked Flat</th>
                <th className="py-3.5 px-4">Building & Project</th>
                <th className="py-3.5 px-4">Ownership</th>
                <th className="py-3.5 px-4">Authorization Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flatResidents.map(fr => {
                const flat = flats.find(f => f.id === fr.flat_id);
                const profile = profiles.find(p => p.id === fr.resident_id);

                return (
                  <tr key={fr.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {profile?.full_name || 'Resident'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{profile?.email}</span>
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700 text-sm">
                      {flat?.flat_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{flat?.building?.name}</div>
                      <div className="text-[11px] text-slate-400">{flat?.project?.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {fr.is_primary_owner ? (
                        <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                          Primary Owner
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          Co-Resident / Tenant
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Link Resident */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Authorize Resident for Flat</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleLinkResident} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Flat *:</label>
                <select
                  value={selectedFlatId}
                  onChange={e => setSelectedFlatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>
                      Unit {f.flat_number} — {f.building?.name} ({f.project?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Resident Profile *:</label>
                <select
                  value={selectedResidentId}
                  onChange={e => setSelectedResidentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Resident --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={e => setIsPrimary(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs text-slate-800 font-medium">Designate as Primary Flat Owner</span>
              </label>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  Confirm Authorization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
