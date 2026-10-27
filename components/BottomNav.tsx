'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Phone, TrendingUp, Heart, Settings } from 'lucide-react';

const TABS = [
  { href: '/',         label: 'Today',   Icon: Home },
  { href: '/calls',    label: 'Calls',   Icon: Phone },
  { href: '/skills',   label: 'Skills',  Icon: TrendingUp },
  { href: '/habits',   label: 'Habits',  Icon: Heart },
  { href: '/settings', label: 'Settings',Icon: Settings },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
         style={{ background: 'var(--hot-surface)', borderTop: '1px solid var(--hot-border)' }}>
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors"
              style={{ color: active ? 'var(--hot-primary)' : 'var(--hot-muted)' }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
