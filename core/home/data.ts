import { Binary, Hash, KeyRound, Link2 } from 'lucide-react'

export type Tool = {
  name: string
  description: string
  href: string
  icon: typeof Hash
  status: 'available' | 'coming-soon'
}

export const TOOLS: Tool[] = [
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

export type Gist = {
  name: string
  description: string
  url: string
  language?: string
}

export const GISTS: Gist[] = [
  {
    name: 'Example Gist',
    description: 'A sample GitHub Gist — replace with your own.',
    url: 'https://gist.github.com/blueorionn',
  },
]
