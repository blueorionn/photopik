'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  Hash,
  KeyRound,
  Binary,
  Link2,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from 'lucide-react'

const links = [
  { name: 'Hash Text', href: '/hash', icon: Hash, available: true },
  { name: 'JWT Decoder', href: '/jwt', icon: KeyRound, available: false },
  {
    name: 'Base64 Encode/Decode',
    href: '/base64',
    icon: Binary,
    available: false,
  },
  { name: 'URL Encode/Decode', href: '/url', icon: Link2, available: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger — always on top */}
      <button
        type='button'
        onClick={() => setMobileOpen(!mobileOpen)}
        className='fixed top-4 left-4 z-50 rounded-md p-2 text-gray-600 hover:bg-gray-200 md:hidden dark:text-gray-400 dark:hover:bg-gray-800'
        aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {mobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/40 md:hidden'
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground dark:border-sidebar-border flex h-full flex-col border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
          // Mobile: hidden by default, slides in from left
          'fixed top-0 left-0 z-40 md:relative md:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo row */}
        <div
          className={cn(
            'dark:border-sidebar-border flex h-16 items-center border-b px-4',
            collapsed && 'justify-center'
          )}
        >
          {!collapsed && (
            <Link
              href='/'
              className='shrink-0 text-lg font-bold'
              onClick={() => setMobileOpen(false)}
            >
              Cryptic<span className='text-[--clr-bs-green]'>world</span>
            </Link>
          )}
          <button
            type='button'
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md p-1.5',
              collapsed ? 'mx-auto' : 'ml-auto'
            )}
          >
            {collapsed ? (
              <PanelLeft className='h-4 w-4' />
            ) : (
              <PanelLeftClose className='h-4 w-4' />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 space-y-1 overflow-y-auto p-3'>
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            const item = (
              <div
                key={link.name}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive && link.available
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  !link.available && 'cursor-not-allowed opacity-50'
                )}
                title={!link.available ? 'Coming soon' : link.name}
              >
                <Icon className='h-5 w-5 shrink-0' />
                {!collapsed && (
                  <>
                    <span className='truncate'>{link.name}</span>
                    {!link.available && (
                      <span className='text-sidebar-foreground/40 ml-auto text-[10px] tracking-wider uppercase'>
                        Soon
                      </span>
                    )}
                  </>
                )}
              </div>
            )

            if (!link.available) {
              return (
                <div key={link.name} className='select-none'>
                  {item}
                </div>
              )
            }

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
