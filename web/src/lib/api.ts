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

export { API_BASE_URL }
