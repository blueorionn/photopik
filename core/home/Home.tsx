import { TOOLS, GISTS } from '@/core/home/data'
import ToolCard from './components/ToolCard'
import GistCard from './components/GistCard'
import { roboto } from '@/lib/font'

export default function Home() {
  return (
    <>
      <main className='w-full'>
        <section
          className='bg-muted/40 w-full py-6 pb-12 md:py-9 md:pb-18 lg:py-12 lg:pb-24'
          aria-label='secondary-header'
        >
          <div className='mx-auto max-w-5xl'>
            <h1 className='text-foreground mx-auto w-max py-4 text-2xl font-bold lg:py-6 lg:text-3xl'>
              Cryptic World
            </h1>
            <h2 className='text-muted-foreground px-4 text-center text-base font-medium lg:text-lg'>
              A growing toolkit for everyday security tasks — hash text, decode
              JWTs, and encode or decode data, all in one place. This
              application encodes all input data using UTF-8 before running any
              operation.
            </h2>
          </div>
        </section>

        <section className='bg-muted w-full px-6 py-6 md:py-12 lg:py-18'>
          <div className='mx-auto max-w-5xl'>
            <h2
              className={`${roboto.className} text-foreground after:bg-border relative w-max text-base font-semibold uppercase after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-24 after:rounded-full md:text-lg lg:text-xl`}
            >
              Tools
            </h2>

            <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-9 md:gap-8 lg:mt-12'>
              {TOOLS.map((tool) => (
                <ToolCard tool={tool} key={tool.name} />
              ))}
            </div>
          </div>
        </section>

        <section className='bg-muted/40 w-full px-6 py-6 md:py-12 lg:py-18'>
          <div className='mx-auto max-w-5xl'>
            <h2
              className={`${roboto.className} text-foreground after:bg-border relative w-max text-base font-semibold uppercase after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-24 after:rounded-full md:text-lg lg:text-xl`}
            >
              Gists
            </h2>

            <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-9 md:gap-8 lg:mt-12'>
              {GISTS.map((gist) => (
                <GistCard gist={gist} key={gist.name} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
