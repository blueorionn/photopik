import type { ReactNode } from 'react'

export function AuthShell({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <main className='relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16 font-sans'>
      {/* soft indigo glow at the top */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.14),transparent_70%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.2),transparent_70%)]'
      />

      <div className='animate-fade-up w-full max-w-sm motion-reduce:animate-none'>
        <div className='flex flex-col items-center text-center'>
          <h1
            className={`text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 ${
              icon ? 'mt-4' : 'mt-8'
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p className='mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400'>
              {description}
            </p>
          ) : null}
        </div>

        <div className='mt-8'>{children}</div>
      </div>
    </main>
  )
}
