'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'

export function SidebarShell({
  sidebar,
  children,
  mainClassName = 'p-4 md:p-6',
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
  mainClassName?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={[
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200',
          'md:relative md:z-auto md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <main className={`flex-1 overflow-y-auto ${mainClassName}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
