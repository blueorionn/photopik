import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FileCode, ExternalLink } from 'lucide-react'
import type { Gist } from '../data'

export default function GistCard({ gist }: { gist: Gist }) {
  const card = (
    <Card
      className={cn(
        'bg-card h-full gap-3 rounded-lg border py-4 transition-all',
        'hover:bg-card/80 hover:scale-[1.02] hover:shadow-md'
      )}
    >
      <CardHeader className='flex items-start justify-between'>
        <FileCode className='text-foreground/70 h-6 w-6' />
        <Badge className='gap-1.5 bg-[--clr-bs-green] text-white hover:bg-[--clr-bs-green]'>
          <ExternalLink className='h-3 w-3' />
          Gist
        </Badge>
      </CardHeader>
      <CardContent>
        <CardTitle className='text-card-foreground mb-1.5 text-base lg:text-lg'>
          {gist.name}
        </CardTitle>
        <p className='text-muted-foreground text-sm'>{gist.description}</p>
        {gist.language && (
          <Badge variant='secondary' className='mt-2 text-xs'>
            {gist.language}
          </Badge>
        )}
      </CardContent>
    </Card>
  )

  return (
    <a
      href={gist.url}
      target='_blank'
      rel='noopener noreferrer nofollow'
      className='block'
    >
      {card}
    </a>
  )
}
