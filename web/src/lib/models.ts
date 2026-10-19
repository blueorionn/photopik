export interface ImageModel {
  id: string
  name: string
  provider: string
  supportsNegativePrompt: boolean
  supportsSeed: boolean
  supportsQuality: boolean
  resolutions: string[]
  maxImages: number
  formats: string[]
  note: string
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'openai/gpt-image-2',
    name: 'GPT Image 2',
    provider: 'OpenAI',
    supportsNegativePrompt: false,
    supportsSeed: false,
    supportsQuality: true,
    resolutions: ['1K', '2K'],
    maxImages: 4,
    formats: ['png', 'jpeg', 'webp'],
    note: 'Strong prompt following. No seed / negative prompt.',
  },
  {
    id: 'bytedance-seed/seedream-4.5',
    name: 'Seedream 4.5',
    provider: 'ByteDance',
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsQuality: false,
    resolutions: ['1K', '2K', '4K'],
    maxImages: 4,
    formats: ['png', 'jpeg'],
    note: 'Seed and negative prompt supported.',
  },
  {
    id: 'black-forest-labs/flux.1-dev',
    name: 'FLUX.1 Dev (router)',
    provider: 'Black Forest Labs',
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsQuality: false,
    resolutions: ['1K', '2K'],
    maxImages: 4,
    formats: ['png', 'jpeg', 'webp'],
    note: 'Router-hosted FLUX. Not your local GPU model.',
  },
  {
    id: 'google/gemini-image',
    name: 'Gemini Image',
    provider: 'Google',
    supportsNegativePrompt: false,
    supportsSeed: false,
    supportsQuality: true,
    resolutions: ['1K', '2K'],
    maxImages: 4,
    formats: ['png', 'jpeg'],
    note: 'Quality tiers supported. No seed.',
  },
]

export const ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
] as const
