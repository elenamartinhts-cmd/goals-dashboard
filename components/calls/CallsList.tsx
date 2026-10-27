'use client';

import { useState } from 'react';
import type { Call, AppSettings } from '@/lib/types';
import { formatUSD } from '@/lib/utils';
import { Edit2, Trash2 } from 'lucide-react';

const OUTCOME_LABEL: Record<string, string> = {
  closed: 'Closed', deposit: 'Deposit', follow_up: 'Follow-up', lost: 'Lost',
};
const OUTCOME_COLOR: Record<string, string> = {
  closed: 'var(--hot-success)', deposit: 'var(--hot-warning)',
  follow_up: 'var(--hot-text-2)', lost: 'var(--hot-danger)',
};

interface Props {
  calls: Call[];
  settings: AppSettings;
  onEdit: (c: Call) => void;
  onRefresh: () => void;
}

export default function CallsList({ calls, settings, onEdit, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this call entry?')) return;
    setDeleting(id);
    await fetch(`/api/calls/${id}`, { method: 'DELETE' });
    setDeleting(null);
    onRefresh();
  }

  if (!calls.length) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--hot-muted)' }}>
        No entries yet.
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-2 pb-4">
      {calls.map(call => {
        const offer = settings.offers.find(o => o.id === call.offer_id);
        return (
          <div key={call.id} className="rounded-xl px-4 py-3"
               style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--hot-text)' }}>
                    {new Date(call.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  {!call.showed ? (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FDDDD9', color: '#8B1A10' }}>No-show</span>
                  ) : call.outcome ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--hot-primary-light)', color: OUTCOME_COLOR[call.outcome] }}>
                      {OUTCOME_LABEL[call.outcome]}
                    </span>
                  ) : null}
                </div>
                {offer && <p className="text-xs" style={{ color: 'var(--hot-text-2)' }}>{offer.name}</p>}
                {call.commission !== null && (
                  <p className="text-xs font-medium" style={{ color: 'var(--hot-success)' }}>
                    {call.outcome === 'closed' ? '+' : '~'}{formatUSD(call.commission)}
                  </p>
                )}
                {call.note && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--hot-muted)' }}>{call.note}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => onEdit(call)} className="p-2 rounded-lg"
                        style={{ background: 'var(--hot-primary-light)' }}>
                  <Edit2 size={14} style={{ color: 'var(--hot-primary)' }} />
                </button>
                <button onClick={() => handleDelete(call.id)}
                        disabled={deleting === call.id}
                        className="p-2 rounded-lg"
                        style={{ background: '#FDDDD9' }}>
                  <Trash2 size={14} style={{ color: 'var(--hot-danger)' }} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
