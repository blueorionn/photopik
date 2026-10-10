// Mirrors the Flask feed payload (photos table) — adjust when the API lands.
export type FeedPhoto = {
  id: string
  slug: string
  name: string
  width: number
  height: number
  storage_key: string
  license: string
  upload_time: string
}
