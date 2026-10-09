import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from './ui/button'

const ICON_BUTTON_CLASS =
  'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer'

type Notification = {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
}

const DECOY_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'maya liked your photo',
    body: 'Morning fog over the lake',
    time: '12m ago',
    unread: true,
  },
  {
    id: '2',
    title: 'jonas started following you',
    body: '3 mutual collections',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    title: 'Collection shared with you',
    body: 'Iceland, summer 2026 by eva',
    time: '3h ago',
    unread: false,
  },
  {
    id: '4',
    title: 'Your photo was featured',
    body: 'In the Fresh Finds shelf',
    time: 'Yesterday',
    unread: false,
  },
]

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [readAll, setReadAll] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const unreadCount = readAll
    ? 0
    : DECOY_NOTIFICATIONS.filter((notification) => notification.unread).length

  return (
    <div className='relative' ref={boxRef}>
      <Button
        variant='ghost'
        size='icon'
        aria-label='Notifications'
        aria-haspopup='true'
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={ICON_BUTTON_CLASS}
      >
        <Bell className='size-4' />
      </Button>

      {unreadCount > 0 && (
        <span
          aria-hidden
          className='bg-accent pointer-events-none absolute top-1.5 right-1.5 size-2 rounded-full'
        />
      )}

      {open && (
        <section
          aria-label='Notifications'
          className='bg-popover text-popover-foreground border-border absolute top-full right-0 z-10 mt-2 w-80 rounded border p-2 shadow-lg'
        >
          <header className='flex items-center justify-between px-2 py-1.5'>
            <h2 className='text-foreground text-sm font-semibold'>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                type='button'
                onClick={() => setReadAll(true)}
                className='text-accent hover:text-accent-hover cursor-pointer text-xs font-medium transition-colors'
              >
                Mark all read
              </button>
            )}
          </header>

          <ul className='border-border mt-1 border-t'>
            {DECOY_NOTIFICATIONS.map(({ id, title, body, time, unread }) => (
              <li key={id} className={`border-border last:border-b-0`}>
                <button
                  type='button'
                  className='hover:bg-muted/10 flex w-full cursor-pointer items-start gap-3 rounded px-2 py-2.5 text-left transition-colors'
                >
                  <span className='min-w-0 flex-1'>
                    <span className='text-foreground block truncate text-sm font-medium'>
                      {title}
                    </span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      {body}
                    </span>
                  </span>
                  <span className='flex shrink-0 flex-col items-end gap-1'>
                    <span className='text-muted-foreground text-xs whitespace-nowrap'>
                      {time}
                    </span>
                    {unread && !readAll && (
                      <span
                        aria-hidden
                        className='bg-accent size-2 rounded-full'
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
