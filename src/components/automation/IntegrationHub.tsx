import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkflowEvent } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import {
  Workflow,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileCode,
  Zap,
} from 'lucide-react';

export const IntegrationHub: React.FC = () => {
  const { currentOrg } = useAuth();
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WorkflowEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, [currentOrg.id]);

  const loadEvents = async () => {
    try {
      const data = await api.getWorkflowEvents(currentOrg.id);
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
            <Workflow className="w-3.5 h-3.5" /> Architecture Specification & Event Bus
          </span>
          <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
            Version 2 Future Integration Ready
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
          n8n Workflow Automation & WhatsApp Channel Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Version 1 runs 100% independently without requiring external webhooks or WhatsApp credentials. All database models, idempotent event logs, and schema structures are pre-configured to plug in n8n workflows seamlessly in Version 2.
        </p>
      </div>

      {/* Architecture Progression Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Version 1: Live & Active */}
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Version 1 (Active Production Core)
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              RUNNING
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            React TypeScript Frontend ➔ Supabase Auth ➔ PostgreSQL Database & Row-Level Security ➔ Private File Storage ➔ Direct Browser Portals.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2 text-emerald-700 font-medium">
              ✓ Multi-tenant data isolation with RLS policies
            </li>
            <li className="flex items-center gap-2 text-emerald-700 font-medium">
              ✓ Dynamic possession date warranty duration calculator
            </li>
            <li className="flex items-center gap-2 text-emerald-700 font-medium">
              ✓ Strict threshold evaluation for contractor quotations
            </li>
            <li className="flex items-center gap-2 text-emerald-700 font-medium">
              ✓ Immutable audit trail for all transitions
            </li>
          </ul>
        </div>

        {/* Version 2: Integration Roadmap */}
        <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" /> Version 2 (Automations & WhatsApp)
            </h3>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              PLANNED SEPARATION
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            WhatsApp Business API ➔ n8n Orchestrator ➔ Authenticated Service Integration ➔ Same Database tables (<code className="text-indigo-600 font-mono">channel_identities</code>, <code className="text-indigo-600 font-mono">workflow_events</code>).
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2 text-slate-600">
              • Inbound conversational intake via verified phone number
            </li>
            <li className="flex items-center gap-2 text-slate-600">
              • Autonomous category-based contractor matching via n8n
            </li>
            <li className="flex items-center gap-2 text-slate-600">
              • WhatsApp status push on approval and work completion
            </li>
            <li className="flex items-center gap-2 text-slate-600">
              • Overdue reminders & daily manager digests
            </li>
          </ul>
        </div>
      </div>

      {/* Idempotent Workflow Events Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" /> Idempotent Event Log Queue (`workflow_events`)
            </h2>
            <p className="text-xs text-slate-500">
              Real events emitted by user actions ready for n8n polling or webhook webhooks without duplication.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{events.length} Recorded Events</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Events List */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No events emitted yet.</p>
            ) : (
              events.map(evt => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3 text-xs cursor-pointer transition-colors flex justify-between items-center ${
                      isSelected ? 'bg-indigo-50/80 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-indigo-700 block">{evt.event_type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {evt.id}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          evt.status === 'processed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {evt.status}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* JSON Payload Inspector */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-auto max-h-80 shadow-inner">
            <div className="text-slate-400 border-b border-slate-800 pb-2 mb-2 flex justify-between">
              <span>Payload Inspector: {selectedEvent?.event_type || 'None'}</span>
              <span>JSON Schema</span>
            </div>
            {selectedEvent ? (
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            ) : (
              <span className="text-slate-500">Select an event from the left to inspect its contract payload.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
