import { createClient } from '@/lib/supabase/server'
import type { Photo } from '@/lib/db/schema'

export type FeedPhoto = {
  id: string
  slug: string
  name: string
  width: number
  height: number
  storage_key: string
  license: Photo['license']
  upload_time: string
}

export const MAX_PER_PAGE_LIMIT = 25

export async function getPublicFeed(
  limit = MAX_PER_PAGE_LIMIT
): Promise<FeedPhoto[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('photos')
    .select('id, slug, name, width, height, storage_key, license, upload_time')
    .eq('is_private', false)
    .is('deleted_at', null)
    .eq('is_nsfw', false)
    .in('license', [
      'public_domain',
      'cc0_1_0',
      'cc_by_3_0',
      'cc_by_4_0',
      'cc_by_sa_3_0',
      'cc_by_sa_4_0',
      'cc_by_nd_3_0',
      'cc_by_nd_4_0',
    ])
    .order('upload_time', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getPublicFeed failed:', error.message)
    throw new Error('Could not load the gallery right now.')
  }

  return data as FeedPhoto[]
}

const CDN_BASE = (process.env.CDN_HOST ?? '').replace(/\/+$/, '')
const PHOTO_PREFIX = (process.env.CDN_PHOTO_PERFFIX ?? '').replace(
  /^\/+|\/+$/g,
  ''
)

export function cdnUrl(storageKey: string): string {
  const prefix = PHOTO_PREFIX ? `${PHOTO_PREFIX}/` : ''
  return `${CDN_BASE}/${prefix}${storageKey}`
}
