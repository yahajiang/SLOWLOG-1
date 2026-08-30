'use client'

import React from 'react'
import Link from 'next/link'

export const AdminLogo: React.FC = () => {
  return (
    <Link href="/admin" className="flex items-center gap-2 no-underline">
      <span className="text-xl font-semibold tracking-tight text-[var(--yh-text)]">
        慢日志
      </span>
      <span className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)] border-l border-[var(--yh-border)] pl-2">
        后台
      </span>
    </Link>
  )
}
