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
      {/* soft accent glow at the top */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(2,159,128,0.16),transparent_70%)]'
      />

      <div className='animate-fade-up w-full max-w-sm motion-reduce:animate-none'>
        <div className='flex flex-col items-center text-center'>
          <h1
            className={`text-foreground text-2xl font-semibold tracking-tight ${
              icon ? 'mt-4' : 'mt-8'
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p className='text-foreground/60 mt-2 text-sm leading-relaxed'>
              {description}
            </p>
          ) : null}
        </div>

        <div className='mt-8'>{children}</div>
      </div>
    </main>
  )
}
