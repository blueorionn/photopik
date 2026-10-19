import type { ImageModel } from '../types/models'

export interface ModelCapabilities {
  aspectRatios: string[]
  resolutions: string[]
  supportsSeed: boolean
  supportsNegativePrompt: boolean
  qualityValues: string[]
  maxImages: number
  formats: string[]
}

export const DEFAULT_MODEL_ID = 'qwen/qwen-image-2.1-turbo'

function enumValues(
  params: ImageModel['supported_parameters'],
  key: string
): string[] {
  const param = params[key]
  if (!param || param.type !== 'enum') return []
  return param.values.map(String)
}

export function deriveCapabilities(model: ImageModel): ModelCapabilities {
  const params = model.supported_parameters
  const nParam = params['n']
  const formats = enumValues(params, 'output_format')
  return {
    aspectRatios: enumValues(params, 'aspect_ratio'),
    resolutions: enumValues(params, 'resolution'),
    supportsSeed: params['seed']?.type === 'boolean',
    supportsNegativePrompt: 'negative_prompt' in params,
    qualityValues: enumValues(params, 'quality'),
    maxImages:
      nParam?.type === 'range' ? Math.max(1, Math.floor(nParam.max)) : 1,
    formats: formats.length > 0 ? formats : ['png'],
  }
}

export const FALLBACK_CAPABILITIES: ModelCapabilities = {
  aspectRatios: ['1:1'],
  resolutions: ['1K'],
  supportsSeed: false,
  supportsNegativePrompt: false,
  qualityValues: [],
  maxImages: 1,
  formats: ['png'],
}
