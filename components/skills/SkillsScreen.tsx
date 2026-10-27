'use client';

import { useState } from 'react';
import type { SkillReview } from '@/lib/types';
import PasteReview from './PasteReview';
import SkillCharts from './SkillCharts';
import ReviewHistory from './ReviewHistory';
import { Plus, X } from 'lucide-react';

type Tab = 'scores' | 'history';

export default function SkillsScreen({ reviews: initial }: { reviews: SkillReview[] }) {
  const [reviews, setReviews] = useState(initial);
  const [tab, setTab]         = useState<Tab>('scores');
  const [showPaste, setShowPaste] = useState(false);
  const [editReview, setEditReview] = useState<SkillReview | null>(null);

  async function refresh() {
    const res = await fetch('/api/reviews');
    if (res.ok) setReviews(await res.json());
  }

  const latest = reviews[0] ?? null;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--hot-bg)' }}>
      <div className="px-5 pt-5 pb-3 safe-top">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold font-display" style={{ color: 'var(--hot-text)' }}>Skills</h1>
          <button
            onClick={() => { setEditReview(null); setShowPaste(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--hot-primary)', color: '#fff' }}
          >
            <Plus size={16} /> Paste review
          </button>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
          {([{ id: 'scores', label: 'Scores' }, { id: 'history', label: 'History' }] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
                    style={{ background: tab === t.id ? 'var(--hot-primary)' : 'transparent',
                             color: tab === t.id ? '#fff' : 'var(--hot-text-2)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {tab === 'scores'  && <SkillCharts reviews={reviews} latest={latest} />}
        {tab === 'history' && <ReviewHistory reviews={reviews} onEdit={r => { setEditReview(r); setShowPaste(true); }} />}
      </div>

      {showPaste && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-t-3xl pt-4 pb-8 px-5 max-h-[95vh] overflow-y-auto"
               style={{ background: 'var(--hot-bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--hot-text)' }}>
                {editReview ? 'Edit review' : 'Paste review'}
              </h2>
              <button onClick={() => { setShowPaste(false); setEditReview(null); }}
                      className="p-2 rounded-full" style={{ background: 'var(--hot-surface)' }}>
                <X size={18} style={{ color: 'var(--hot-text-2)' }} />
              </button>
            </div>
            <PasteReview
              initialData={editReview}
              onSaved={() => { setShowPaste(false); setEditReview(null); refresh(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
