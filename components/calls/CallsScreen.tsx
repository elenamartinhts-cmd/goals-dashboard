'use client';

import { useState } from 'react';
import type { Call, AppSettings, MonthMetrics } from '@/lib/types';
import BulkDayForm from './BulkDayForm';
import CallsMetrics from './CallsMetrics';
import CallsList from './CallsList';
import CallsCharts from './CallsCharts';
import { Plus, X } from 'lucide-react';

interface Props {
  calls: Call[];
  settings: AppSettings;
  monthMetrics: MonthMetrics;
  today: string;
}

type Tab = 'metrics' | 'log' | 'charts';

export default function CallsScreen({ calls: initialCalls, settings, monthMetrics, today }: Props) {
  const [calls, setCalls] = useState(initialCalls);
  const [tab, setTab] = useState<Tab>('metrics');
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    const res = await fetch('/api/calls');
    if (res.ok) setCalls(await res.json());
  }

  function handleEdit(_call: Call) {
    setShowForm(true);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'metrics', label: 'Metrics' },
    { id: 'log',     label: 'Log' },
    { id: 'charts',  label: 'Charts' },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--hot-bg)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 safe-top">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>Calls</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--hot-primary)', color: '#fff' }}
          >
            <Plus size={16} /> Log day
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
              style={{
                background: tab === t.id ? 'var(--hot-primary)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--hot-text-2)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {tab === 'metrics' && <CallsMetrics calls={calls} settings={settings} monthMetrics={monthMetrics} today={today} onEdit={handleEdit} />}
        {tab === 'log'     && <CallsList calls={calls} settings={settings} onEdit={handleEdit} onRefresh={refresh} />}
        {tab === 'charts'  && <CallsCharts calls={calls} settings={settings} today={today} />}
      </div>

      {/* Log call modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-t-3xl pt-4 pb-8 px-5 max-h-[90vh] overflow-y-auto"
               style={{ background: 'var(--hot-bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--hot-text)' }}>Log today's calls</h2>
              <button onClick={() => setShowForm(false)}
                      className="p-2 rounded-full" style={{ background: 'var(--hot-surface)' }}>
                <X size={18} style={{ color: 'var(--hot-text-2)' }} />
              </button>
            </div>
            <BulkDayForm
              today={today}
              onSaved={() => { setShowForm(false); refresh(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
