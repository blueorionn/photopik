import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className='relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16 font-sans'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(2,159,128,0.16),transparent_70%)]'
      />

      <div className='animate-fade-up w-full max-w-sm text-center motion-reduce:animate-none'>
        <p className='text-muted font-mono text-4xl tracking-widest'>404</p>
        <p className='text-foreground/60 mt-2 text-sm leading-relaxed'>
          The page you&rsquo;re looking for doesn&rsquo;t exist, or it was moved
          somewhere else.
        </p>
        <Link
          to='/'
          className='bg-accent text-accent-foreground hover:bg-accent-hover mt-8 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
        >
          Back to gallery
        </Link>
      </div>
    </main>
  )
}
