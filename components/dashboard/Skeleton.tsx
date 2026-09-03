export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[var(--dash-bg)] animate-pulse rounded-none ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-[var(--dash-border)] last:border-0">
      <Skeleton className="w-4 h-4" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  )
}

export function GridCardSkeleton() {
  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 flex-1" />
        </div>
      </div>
    </div>
  )
}

export function PostsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
        <div className="px-4 py-2 border-b border-[var(--dash-border)] bg-[var(--dash-bg)]">
          <Skeleton className="h-3 w-32" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => <ListItemSkeleton key={i} />)}
      </div>
    </div>
  )
}

export function CategoriesPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-20" />
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 flex gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-[var(--dash-border)] last:border-0">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotesPageSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-7 w-20" />
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MediaPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-96" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <GridCardSkeleton key={i} />)}
      </div>
    </div>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-7 w-16" />
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 space-y-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-24 mt-2" />
      </div>
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--dash-border)] last:border-0">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
