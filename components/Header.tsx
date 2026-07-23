'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'
import { useThemeProvider } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'

// lucide-react ships the legacy bird mark under `Twitter`, not the current
// X wordmark — kept as an inline SVG so the brand mark stays accurate.
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 1200 1227' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path d='M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z' />
    </svg>
  )
}

export default function Header() {
  const { theme, setTheme } = useThemeProvider()

  return (
    <header className='relative z-100 h-max w-full bg-gray-200 dark:bg-gray-800'>
      <nav className='mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 md:py-6 lg:px-0'>
        <Link
          href='/'
          className='flex w-max items-center justify-center gap-1 md:gap-2'
        >
          <Image
            src='/icon/crypticworld-logo.png'
            alt='Website Logo'
            height={48}
            width={48}
            className='aspect-auto h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12'
          />
          <h1 className='text-xl font-bold text-gray-800 lg:text-2xl dark:text-gray-200'>
            Cryptic<span className='text-[--clr-bs-green]'>world</span>
          </h1>
        </Link>

        <div className='flex w-max items-center justify-center gap-2 lg:gap-4'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className='rounded-full border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-800'
          >
            <Sun className='h-4 w-4 scale-100 fill-gray-800 stroke-gray-800 transition-all dark:scale-0' />
            <Moon className='absolute h-4 w-4 scale-0 fill-gray-400 stroke-gray-400 transition-all dark:scale-100' />
            <span className='sr-only'>Toggle theme</span>
          </Button>

          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <a
              href='https://github.com/blueorionn/crypticworld'
              target='_blank'
              rel='noopener noreferrer nofollow'
            >
              <a
                href='https://github.com/blueorionn/calcify'
                target='_blank'
                rel='noopener noreferrer nofollow'
                aria-label='GitHub Repository'
              >
                <svg
                  className='size-5'
                  viewBox='0 0 100 100'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    clipRule='evenodd'
                    d='M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z'
                  />
                </svg>
              </a>{' '}
              <span className='sr-only'>Github Profile</span>
            </a>
          </Button>

          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <a
              href='https://x.com/SSwadhinTandi'
              target='_blank'
              rel='noopener noreferrer nofollow'
            >
              <XIcon className='h-3 w-3 fill-gray-500 transition-all hover:fill-gray-800 md:h-4 md:w-4 dark:fill-gray-400 dark:hover:fill-gray-200' />
              <span className='sr-only'>Twitter Profile</span>
            </a>
          </Button>
        </div>
      </nav>
    </header>
  )
}
