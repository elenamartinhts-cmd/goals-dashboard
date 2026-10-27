'use client';

import { useState } from 'react';
import type { SkillReview } from '@/lib/types';
import { SKILL_LABELS, SKILL_KEYS } from '@/lib/types';
import { parseReviewText } from '@/lib/utils';

interface Props {
  initialData: SkillReview | null;
  onSaved: () => void;
}

function toEditable(r: SkillReview) {
  return {
    date:                 r.date,
    calls_reviewed:       String(r.calls_reviewed),
    objection_handling:   r.objection_handling !== null ? String(r.objection_handling) : '-',
    statement_close:      r.statement_close !== null ? String(r.statement_close) : '-',
    commitment_phase:     r.commitment_phase !== null ? String(r.commitment_phase) : '-',
    tonality_confidence:  r.tonality_confidence !== null ? String(r.tonality_confidence) : '-',
    deep_questions:       r.deep_questions !== null ? String(r.deep_questions) : '-',
    focus_skill:          r.focus_skill,
    why:                  r.why,
    drill:                r.drill,
    todos:                r.todos.join('\n'),
    win:                  r.win,
  };
}

const BLANK = {
  date: new Date().toISOString().slice(0, 10),
  calls_reviewed: '', objection_handling: '', statement_close: '',
  commitment_phase: '', tonality_confidence: '', deep_questions: '',
  focus_skill: '', why: '', drill: '', todos: '', win: '',
};

type Fields = typeof BLANK;

export default function PasteReview({ initialData, onSaved }: Props) {
  const [raw,      setRaw]      = useState('');
  const [step,     setStep]     = useState<'paste' | 'preview'>(initialData ? 'preview' : 'paste');
  const [fields,   setFields]   = useState<Fields>(initialData ? toEditable(initialData) : BLANK);
  const [parseErr, setParseErr] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  function handleParse() {
    const parsed = parseReviewText(raw);
    if (!parsed) {
      setParseErr('Could not parse — make sure the text starts with REVIEW UPDATE');
      return;
    }
    setFields({
      date:                 parsed['date'] ?? BLANK.date,
      calls_reviewed:       parsed['calls_reviewed'] ?? '0',
      objection_handling:   parsed['objection_handling'] ?? '-',
      statement_close:      parsed['statement_close'] ?? '-',
      commitment_phase:     parsed['commitment_phase'] ?? '-',
      tonality_confidence:  parsed['tonality___confidence'] ?? parsed['tonality_confidence'] ?? '-',
      deep_questions:       parsed['deep_questions'] ?? '-',
      focus_skill:          parsed['focus_skill'] ?? '',
      why:                  parsed['why'] ?? '',
      drill:                parsed['drill'] ?? '',
      todos:                (parsed['todos'] ?? '').replace(/\|\|\|/g, '\n'),
      win:                  parsed['win'] ?? '',
    });
    setParseErr('');
    setStep('preview');
  }

  function parseScore(v: string): number | null {
    if (!v || v === '-') return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : Math.min(5, Math.max(1, n));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const payload = {
      date:                fields.date,
      calls_reviewed:      parseInt(fields.calls_reviewed) || 0,
      objection_handling:  parseScore(fields.objection_handling),
      statement_close:     parseScore(fields.statement_close),
      commitment_phase:    parseScore(fields.commitment_phase),
      tonality_confidence: parseScore(fields.tonality_confidence),
      deep_questions:      parseScore(fields.deep_questions),
      focus_skill:         fields.focus_skill.trim(),
      why:                 fields.why.trim(),
      drill:               fields.drill.trim(),
      todos:               fields.todos.split('\n').map(t => t.trim()).filter(Boolean),
      win:                 fields.win.trim(),
    };
    try {
      const url    = initialData ? `/api/reviews/${initialData.id}` : '/api/reviews';
      const method = initialData ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error saving');
      setSaving(false);
    }
  }

  const f = (key: keyof Fields) => ({
    value: fields[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields(prev => ({ ...prev, [key]: e.target.value })),
  });

  const inputStyle = {
    background: 'var(--hot-surface)',
    borderColor: 'var(--hot-border)',
    color: 'var(--hot-text)',
  };

  if (step === 'paste') {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--hot-text-2)' }}>
          Paste the full REVIEW UPDATE block from your coaching chat.
        </p>
        <textarea
          {...f('date')}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          rows={12}
          placeholder={'REVIEW UPDATE\nDate: 2026-11-01\nCalls reviewed: 3\n…'}
          className="w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none resize-none"
          style={inputStyle}
        />
        {parseErr && <p className="text-sm" style={{ color: 'var(--hot-danger)' }}>{parseErr}</p>}
        <button onClick={handleParse} disabled={!raw.trim()}
                className="w-full h-12 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--hot-primary)', color: '#fff' }}>
          Preview
        </button>
      </div>
    );
  }

  // Preview / edit mode
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--hot-text-2)' }}>Date</label>
          <input type="date" {...f('date')} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--hot-text-2)' }}>Calls reviewed</label>
          <input type="number" {...f('calls_reviewed')} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--hot-text-2)' }}>Scores (1–5 or - for not judged)</p>
        <div className="grid grid-cols-2 gap-2">
          {SKILL_KEYS.map(k => (
            <div key={k}>
              <label className="block text-[11px] mb-1" style={{ color: 'var(--hot-muted)' }}>{SKILL_LABELS[k]}</label>
              <input {...f(k as keyof Fields)} className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      {[
        { key: 'focus_skill', label: 'Focus skill' },
        { key: 'why',         label: 'Why' },
        { key: 'drill',       label: 'Drill' },
        { key: 'win',         label: 'Win' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--hot-text-2)' }}>{label}</label>
          <input {...f(key as keyof Fields)} className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={inputStyle} />
        </div>
      ))}

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--hot-text-2)' }}>To-dos (one per line)</label>
        <textarea {...f('todos')} rows={3} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--hot-danger)' }}>{error}</p>}

      <div className="flex gap-2">
        {!initialData && (
          <button onClick={() => setStep('paste')} className="flex-1 h-12 rounded-xl font-medium text-sm"
                  style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)', color: 'var(--hot-text-2)' }}>
            Back
          </button>
        )}
        <button onClick={handleSave} disabled={saving}
                className="flex-1 h-12 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--hot-primary)', color: '#fff' }}>
          {saving ? 'Saving…' : 'Save review'}
        </button>
      </div>
    </div>
  );
}
