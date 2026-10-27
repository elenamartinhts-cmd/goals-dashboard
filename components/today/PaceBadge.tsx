import type { PaceBadge as PaceBadgeType } from '@/lib/types';

const MAP: Record<PaceBadgeType, { label: string; className: string }> = {
  ahead:       { label: 'Ahead',        className: 'badge-ahead' },
  on_pace:     { label: 'On pace',      className: 'badge-on-pace' },
  behind:      { label: 'Behind',       className: 'badge-behind' },
  not_started: { label: 'Not started',  className: 'badge-on-pace' },
};

export default function PaceBadge({ badge }: { badge: PaceBadgeType }) {
  const { label, className } = MAP[badge];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  );
}
