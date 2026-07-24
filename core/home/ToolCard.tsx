import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Binary, Hash, KeyRound, Link2 } from 'lucide-react'

export type Tool = {
  name: string
  description: string
  href: string
  icon: typeof Hash
  status: 'available' | 'coming-soon'
}

export const tools: Tool[] = [
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
    description:
      'Decode and inspect the header, payload, and signature of a JWT.',
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

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const isAvailable = tool.status === 'available'

  const card = (
    <Card
      className={cn(
        'bg-card h-full gap-3 rounded-lg border py-4 transition-all',
        isAvailable && 'hover:bg-card/80 hover:scale-[1.02] hover:shadow-md'
      )}
    >
      <CardHeader className='flex items-start justify-between'>
        <Icon className='text-foreground/70 h-6 w-6' />
        {isAvailable ? (
          <Badge className='gap-1.5 bg-[--clr-bs-green] text-white hover:bg-[--clr-bs-green]'>
            <span className='h-1.5 w-1.5 rounded-full bg-white' />
            Available
          </Badge>
        ) : (
          <Badge variant='secondary'>Coming soon</Badge>
        )}
      </CardHeader>
      <CardContent>
        <CardTitle className='text-card-foreground mb-1.5 text-base lg:text-lg'>
          {tool.name}
        </CardTitle>
        <p className='text-muted-foreground text-sm'>{tool.description}</p>
      </CardContent>
    </Card>
  )

  if (!isAvailable) {
    return (
      <div
        aria-disabled
        className='cursor-not-allowed opacity-70'
        title='Coming soon'
      >
        {card}
      </div>
    )
  }

  return <Link href={tool.href}>{card}</Link>
}
