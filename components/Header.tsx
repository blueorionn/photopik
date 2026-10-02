'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeProvider } from '@/context/ThemeContext'

export default function Header() {
  const { theme, setTheme } = useThemeProvider()

  return (
    <>
      <header className='border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6'>
          <Link href='/' className='flex shrink-0 items-center gap-2'>
            <Image
              src='/photopik.svg'
              alt='photopik logo'
              width={32}
              height={32}
              priority
              className='size-8'
            />
            <span className='text-foreground text-base font-semibold tracking-tight'>
              photopik<span className='text-accent'>.</span>
            </span>
          </Link>

          {/* search stub — wired up when the media API exists */}
          <input
            type='search'
            placeholder='Search photos…'
            aria-label='Search photos'
            className='border-border bg-surface text-foreground placeholder:text-muted/70 focus:border-accent focus:ring-accent/30 mx-auto hidden w-full max-w-md rounded-lg border px-4 py-2 text-sm transition-colors focus:ring-2 focus:outline-none sm:block'
          />

          <div className='flex w-max items-center justify-center'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className='cursor-pointer'
            >
              {theme === 'dark' ? (
                <Sun className='size-5' />
              ) : (
                <Moon className='size-5' />
              )}
            </Button>
            <Link
              href='/auth/login'
              className='bg-accent text-accent-foreground hover:bg-accent-hover shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors'
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
