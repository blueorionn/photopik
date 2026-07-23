import Header from '@/components/Header'
import { ToolCard, tools } from '@/core/home/ToolCard'

export default function Home() {
  return (
    <>
      <Header />
      <main className='w-full'>
        <section
          className='w-full bg-gray-200 py-6 pb-12 md:py-9 md:pb-18 lg:py-12 lg:pb-24 dark:bg-gray-800'
          aria-label='secondary-header'
        >
          <div className='mx-auto max-w-5xl'>
            <h1 className='mx-auto w-max py-4 text-2xl font-bold text-gray-900 lg:py-6 lg:text-3xl dark:text-gray-200'>
              Cryptic World
            </h1>
            <h2 className='px-4 text-center text-base font-medium text-gray-700 lg:text-lg dark:text-gray-300'>
              A growing toolkit for everyday security tasks — hash text, decode
              JWTs, and encode or decode data, all in one place. This
              application encodes all input data using UTF-8 before running any
              operation.
            </h2>
          </div>
        </section>

        <section className='w-full bg-gray-300 px-6 py-6 md:py-12 lg:py-18 dark:bg-gray-900'>
          <div className='mx-auto max-w-5xl'>
            <h2 className="w-max text-base font-semibold text-gray-700 after:absolute after:mt-1 after:block after:h-1 after:w-[10%] after:bg-gray-400 after:opacity-80 after:content-[''] md:text-lg md:after:w-[5%] lg:text-xl dark:text-gray-300 after:dark:bg-gray-700">
              Tools
            </h2>

            <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-9 md:gap-8 lg:mt-12 lg:grid-cols-4'>
              {tools.map((tool) => (
                <ToolCard tool={tool} key={tool.name} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
