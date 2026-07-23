import Image from 'next/image'
import Link from 'next/link'
import { Binary, Hash, KeyRound, Link2 } from 'lucide-react'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'


type Tool = {
  name: string
  description: string
  href: string
  icon: typeof Hash
  status: 'available' | 'coming-soon'
}

const tools: Tool[] = [
  {
    name: 'Hash Text',
    description:
      'Generate hashes from any text using algorithms like SHA-256, MD5, and Blake2b.',
    href: '/hash',
    icon: Hash,
    status: 'available',
  },
  {
    name: 'JWT Decoder',
    description: 'Decode and inspect the header, payload, and signature of a JWT.',
    href: '/jwt',
    icon: KeyRound,
    status: 'coming-soon',
  },
  {
    name: 'Base64 Encode / Decode',
    description: 'Convert text to and from Base64 in either direction.',
    href: '/base64',
    icon: Binary,
    status: 'coming-soon',
  },
  {
    name: 'URL Encode / Decode',
    description: 'Percent-encode or decode strings for safe use in URLs.',
    href: '/url',
    icon: Link2,
    status: 'coming-soon',
  },
]

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const isAvailable = tool.status === 'available'

  const card = (
    <Card
      className={cn(
        'h-full gap-3 rounded border-none bg-gray-400 py-4 transition-all dark:bg-gray-700',
        isAvailable && 'hover:scale-105 hover:bg-gray-400/90 dark:hover:bg-gray-700/80',
      )}
    >
      <CardHeader className='flex items-start justify-between'>
        <Icon className='h-6 w-6 text-gray-800 dark:text-gray-300' />
        {isAvailable ? (
          <Badge className='gap-1.5 bg-[--clr-bs-green] text-gray-950 hover:bg-[--clr-bs-green]'>
            <span className='h-1.5 w-1.5 rounded-full bg-gray-950' />
            Available
          </Badge>
        ) : (
          <Badge
            variant='secondary'
            className='bg-gray-500 text-gray-100 dark:bg-gray-800 dark:text-gray-400'
          >
            Coming soon
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <CardTitle className='mb-1.5 text-base text-gray-800 lg:text-lg dark:text-gray-300'>
          {tool.name}
        </CardTitle>
        <p className='text-sm text-gray-700 dark:text-gray-400'>{tool.description}</p>
      </CardContent>
    </Card>
  )

  if (!isAvailable) {
    return (
      <div aria-disabled className='cursor-not-allowed opacity-70' title='Coming soon'>
        {card}
      </div>
    )
  }

  return <Link href={tool.href}>{card}</Link>
}

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
              A growing toolkit for everyday security tasks — hash text,
              decode JWTs, and encode or decode data, all in one place. This
              application encodes all input data using UTF-8 before running
              any operation.
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
