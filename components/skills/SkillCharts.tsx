'use client';

import type { SkillReview, SkillKey } from '@/lib/types';
import { SKILL_KEYS, SKILL_LABELS } from '@/lib/types';

const SKILL_TIPS: Record<string, string> = {
  'Objection handling': "When they push back, pause two seconds before replying. Acknowledge their concern fully, then ask: 'What specifically worries you about that?' — surface the real fear before answering it. Answer only that one fear, then re-ask for the commitment. Never defend your offer before you know what you're actually defending against.",
  'Statement close': "Close as a statement, not a question. After building value, say: 'Based on everything you've shared, here's what we're doing — [offer]. The investment is X.' Then go silent. No upward inflection, no 'Does that work for you?' A question invites delay. State it, breathe, and let silence create the pressure.",
  'Commitment phase': "Move to commitment only after the prospect has felt the cost of staying stuck in their own numbers. Before you mention price, say their break-even out loud: 'Staying the same is costing you approximately X per month.' Then present the offer as the logical next step. Hold your frame — the next person to speak feels the pressure.",
  'Tonality & confidence': "Your tone is the subtext — the prospect hears your certainty before they understand your words. Record today's calls and listen back at 1.5×. Flag every moment your voice rises at the end of a statement (approval-seeking). Goal: steady pace, slight downward inflection on key claims, zero filler words between sections. Certainty is a skill you can drill.",
  'Deep questions': "Use 'what' and 'how' questions — never 'do you' questions. Instead of 'Do you want to change that?' ask 'What would it mean for your life if that changed?' Go three layers deep on every pain: surface → emotional → identity. The prospect must feel the gap between where they are and where they want to be before you offer the bridge.",
};

interface Props { reviews: SkillReview[]; latest: SkillReview | null; }

export default function SkillCharts({ reviews, latest }: Props) {
  if (!reviews.length || !latest) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--hot-muted)' }}>No reviews yet — paste your first one above.</p>
      </div>
    );
  }

  // Focus skill: use review's focus_skill, fall back to lowest score
  const focusKey: SkillKey = SKILL_KEYS.find(k => SKILL_LABELS[k] === latest.focus_skill) ??
    SKILL_KEYS.reduce((min, k) => ((latest[k] ?? 5) < (latest[min] ?? 5) ? k : min), SKILL_KEYS[0]);

  const focusScore = latest[focusKey] ?? null;
  const focusTip = SKILL_TIPS[SKILL_LABELS[focusKey]] ?? null;

  return (
    <div className="space-y-4 pt-2 pb-4">

      {/* Main focus skill card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--hot-surface)', border: '2px solid var(--hot-primary)' }}>
        <div className="flex items-start justify-between mb-1">
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--hot-muted)' }}>
            Skill to focus on
          </p>
          <span className="text-[10px]" style={{ color: 'var(--hot-muted)' }}>{latest.date}</span>
        </div>

        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--hot-primary)' }}>
            {SKILL_LABELS[focusKey]}
          </h2>
          {focusScore !== null && (
            <span className="text-sm font-medium" style={{ color: 'var(--hot-muted)' }}>
              {focusScore}/5
            </span>
          )}
        </div>

        {focusScore !== null && (
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-2 flex-1 rounded-full"
                   style={{ background: i <= focusScore ? 'var(--hot-primary)' : 'var(--hot-primary-light)' }} />
            ))}
          </div>
        )}

        {latest.why && (
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--hot-muted)' }}>
              Why this
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--hot-text-2)' }}>
              {latest.why}
            </p>
          </div>
        )}

        {focusTip && (
          <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--hot-primary-light)' }}>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--hot-primary-dark)' }}>
              On your next call
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--hot-text)' }}>
              {focusTip}
            </p>
          </div>
        )}

        {latest.drill && (
          <div className="rounded-xl p-3" style={{ background: 'var(--hot-bg)' }}>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--hot-muted)' }}>
              Today's drill
            </p>
            <p className="text-xs leading-snug font-medium" style={{ color: 'var(--hot-text)' }}>
              {latest.drill}
            </p>
          </div>
        )}
      </div>

      {/* All scores summary — compact */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--hot-surface)', border: '1px solid var(--hot-border)' }}>
        <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--hot-muted)' }}>
          All scores
        </p>
        <div className="space-y-2">
          {SKILL_KEYS.map(k => {
            const v = latest[k] ?? null;
            const isFocus = k === focusKey;
            return (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs w-32 flex-shrink-0"
                      style={{ color: isFocus ? 'var(--hot-primary)' : 'var(--hot-text-2)', fontWeight: isFocus ? 600 : 400 }}>
                  {SKILL_LABELS[k]}
                </span>
                {v !== null ? (
                  <>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hot-primary-light)' }}>
                      <div className="h-full rounded-full"
                           style={{ width: `${(v / 5) * 100}%`, background: isFocus ? 'var(--hot-primary)' : 'var(--hot-border)' }} />
                    </div>
                    <span className="text-xs font-medium w-4 text-right"
                          style={{ color: isFocus ? 'var(--hot-primary)' : 'var(--hot-text-2)' }}>{v}</span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--hot-muted)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
