export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-shadow duration-[var(--duration-normal)]">
      <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--dash-muted)] mt-1">{sub}</p>}
    </div>
  )
}
