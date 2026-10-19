import type { ImageModel } from '../types/models'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000'

export async function fetchTextToImageModels(
  signal?: AbortSignal
): Promise<ImageModel[]> {
  const response = await fetch(`${API_BASE_URL}/models`, { signal })
  if (!response.ok) {
    throw new Error(`GET /models failed with ${response.status}`)
  }
  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('GET /models returned an unexpected shape')
  }
  return data as ImageModel[]
}

export interface GenerateImageRequest {
  prompt: string
  model: string
  negative_prompt?: string
  aspect_ratio: string
  resolution: string
  seed?: number
  n: number
  quality?: string
  output_format: string
  width: number
  height: number
}

/** POST /generate -> { data: { image: "<base64>" } }. Returns a ready-to-use data URI. */
export async function generateImage(
  request: GenerateImageRequest,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? ((payload as { error: string }).error as string)
        : typeof payload === 'string'
          ? payload
          : `POST /generate failed with ${response.status}`
    throw new Error(message)
  }

  const image =
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data: unknown }).data &&
    typeof (payload as { data: unknown }).data === 'object'
      ? ((payload as { data: { image?: unknown } }).data.image as unknown)
      : undefined

  if (typeof image !== 'string' || image.length === 0) {
    throw new Error('POST /generate returned no image data')
  }
  if (image.startsWith('data:')) return image
  const mime =
    request.output_format === 'jpg'
      ? 'image/jpeg'
      : `image/${request.output_format}`
  return `data:${mime};base64,${image}`
}

export { API_BASE_URL }
