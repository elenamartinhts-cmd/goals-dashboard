import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--hot-bg)' }}>
      {children}
      <BottomNav />
    </div>
  );
}
