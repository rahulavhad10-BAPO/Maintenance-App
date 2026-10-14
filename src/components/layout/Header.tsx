import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Building2,
  UserCheck,
  RefreshCw,
  Database,
  ChevronDown,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    currentOrg,
    currentRole,
    isLiveSupabase,
    switchPersona,
    switchOrganization,
    resetDemoData,
  } = useAuth();

  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand & Organization */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">Antigravity</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  Builder Maintenance OS
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium space-x-1">
                <span>{currentOrg.name}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">Multi-Tenant</span>
              </div>
            </div>
          </div>

          {/* Right actions: Mode pill, Persona Switcher, Notifications, Demo reset */}
          <div className="flex items-center space-x-3">
            {/* Live or Local status */}
            <div
              className={`hidden md:flex items-center text-xs px-2.5 py-1 rounded-full font-medium border ${
                isLiveSupabase
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
              title={
                isLiveSupabase
                  ? 'Connected to live Supabase backend'
                  : 'Running locally with persistent in-memory/localStorage engine. Supabase credentials can be added to .env'
              }
            >
              <Database className="w-3.5 h-3.5 mr-1" />
              {isLiveSupabase ? 'Supabase Connected' : 'Demo & Mock Engine'}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                title="Switch active user persona to test role-based permissions"
              >
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Role:</span>
                <span className="text-indigo-700 font-bold capitalize">
                  {currentRole.replace(/_/g, ' ')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showPersonaMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowPersonaMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Interactive Role Persona Switcher
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Instantly test the app from any stakeholder's perspective
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {DEMO_PERSONAS.map(p => (
                      <button
                        key={p.role}
                        onClick={() => {
                          switchPersona(p);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-start space-x-2.5 ${
                          currentRole === p.role ? 'bg-indigo-50/80 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`mt-0.5 p-1 rounded ${
                            currentRole === p.role ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{p.title}</span>
                            {currentRole === p.role && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{p.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                title="In-app notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowNotifMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} unread)</span>
                    <span className="text-[11px] text-indigo-600 font-medium">In-App Alerts</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-3 text-xs cursor-pointer transition-colors ${
                            n.is_read ? 'bg-white text-slate-600' : 'bg-indigo-50/50 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset all demo complaints and quotations back to default state?')) {
                  resetDemoData();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Reset sample complaints & quotation state to fresh demo values"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
