'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Sun,
  Moon,
  Bell,
  CirclePlus,
  Search,
  User,
  GalleryVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeProvider } from '@/context/ThemeContext'

// shared look for the header icon buttons — hairline box, muted glyph
const ICON_BUTTON_CLASS =
  'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer'

export default function HeaderClient({ userEmail }: { userEmail?: string }) {
  const { theme, setTheme } = useThemeProvider()

  return (
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

        <div className='ml-auto flex w-max items-center justify-center gap-2'>
          <div className='hidden items-center gap-2 sm:flex'>
            <Button
              asChild
              variant='ghost'
              size='icon'
              className={ICON_BUTTON_CLASS}
            >
              <Link href='/search' aria-label='Search photos'>
                <Search className='size-4' />
              </Link>
            </Button>

            <Button
              asChild
              variant='ghost'
              size='icon'
              className={ICON_BUTTON_CLASS}
            >
              <Link href='/scroll' aria-label='Scroll mode'>
                <GalleryVertical className='size-4' />
              </Link>
            </Button>

            {/* stubs — wired up when notifications and upload exist */}
            <Button
              variant='ghost'
              size='icon'
              aria-label='Notifications'
              className={ICON_BUTTON_CLASS}
            >
              <Bell className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Upload photo'
              className={ICON_BUTTON_CLASS}
            >
              <CirclePlus className='size-4' />
            </Button>

            {/* soft divider between app actions and the account cluster */}
            <div
              aria-hidden
              className='bg-foreground/20 dark:bg-foreground/30 mx-1 h-5 w-px shrink-0'
            />
          </div>

          {/* mobile: search link and divider */}
          <div className='flex items-center gap-2 sm:hidden'>
            <Button
              asChild
              variant='ghost'
              size='icon'
              className={ICON_BUTTON_CLASS}
            >
              <Link href='/search' aria-label='Search photos'>
                <Search className='size-4' />
              </Link>
            </Button>
            <Button
              asChild
              variant='ghost'
              size='icon'
              className={ICON_BUTTON_CLASS}
            >
              <Link href='/scroll' aria-label='Scroll mode'>
                <GalleryVertical className='size-4' />
              </Link>
            </Button>
            <div
              aria-hidden
              className='bg-foreground/20 dark:bg-foreground/30 mx-1 h-5 w-px shrink-0'
            />
          </div>

          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={ICON_BUTTON_CLASS}
          >
            {theme === 'dark' ? (
              <Sun className='size-4' />
            ) : (
              <Moon className='size-4' />
            )}
          </Button>

          {userEmail ? (
            // TODO: point at the real user page when it exists
            <Link
              href='/account'
              aria-label='Your account'
              className='bg-accent text-accent-foreground hover:bg-accent-hover flex size-9 shrink-0 items-center justify-center rounded-full transition-colors'
            >
              <User className='size-4' />
            </Link>
          ) : (
            <Link
              href='/auth/login'
              className='bg-accent text-accent-foreground hover:bg-accent-hover shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors'
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
