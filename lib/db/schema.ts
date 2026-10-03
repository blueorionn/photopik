import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  bigint,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const photoLicense = pgEnum('photo_license', [
  'reserved', // All Rights Reserved
  'public_domain',
  'cc0_1_0', // CC0 1.0 Universal
  'cc_by_3_0',
  'cc_by_4_0',
  'cc_by_sa_3_0',
  'cc_by_sa_4_0',
  'cc_by_nc_3_0',
  'cc_by_nc_4_0',
  'cc_by_nc_sa_3_0',
  'cc_by_nc_sa_4_0',
  'cc_by_nd_3_0',
  'cc_by_nd_4_0',
  'cc_by_nc_nd_3_0',
  'cc_by_nc_nd_4_0',
])

export const photos = pgTable(
  'photos',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    license: photoLicense('license').notNull().default('reserved'),
    uploadedBy: uuid('uploaded_by').notNull(),
    uploadTime: timestamp('upload_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mimeType: text('mime_type').notNull(),
    storageKey: text('storage_key').notNull(),
    hash: text('hash').notNull(),
    isNsfw: boolean('is_nsfw').notNull().default(false),
    isPrivate: boolean('is_private').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    // slug recycles after soft delete, hence partial uniqueness
    uniqueIndex('photos_slug_key')
      .on(t.slug)
      .where(sql`deleted_at is null`),
    uniqueIndex('photos_storage_key_key').on(t.storageKey),
    index('photos_uploaded_by_idx').on(t.uploadedBy),
    index('photos_hash_idx').on(t.hash),
    index('photos_public_feed_idx')
      .on(t.uploadTime.desc())
      .where(sql`is_private = false and deleted_at is null`),
    check('photos_dimensions_check', sql`width > 0 and height > 0`),
    check('photos_file_size_check', sql`file_size > 0`),
  ]
)

/*
 * hidden_photos — per-user
 */
export const hiddenPhotos = pgTable(
  'hidden_photos',
  {
    userId: uuid('user_id').notNull(),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    hiddenAt: timestamp('hidden_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.photoId] }),
    index('hidden_photos_photo_id_idx').on(t.photoId),
  ]
)

/*
 * collections — user-owned albums of existing photos.
 * FK to auth.users is added in the migration SQL (cross-schema).
 */
export const collections = pgTable(
  'collections',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    isPrivate: boolean('is_private').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    // slug recycles after soft delete, same convention as photos
    uniqueIndex('collections_slug_key')
      .on(t.slug)
      .where(sql`deleted_at is null`),
    index('collections_user_id_idx').on(t.userId),
    // the public collections browse, newest first
    index('collections_public_browse_idx')
      .on(t.createdAt.desc())
      .where(sql`is_private = false and deleted_at is null`),
  ]
)

/*
 * collection_photos — junction. Visibility composes: a row is only
 * readable when BOTH the collection and the photo are readable by the
 * viewer (enforced by the RLS policies in the migration).
 */
export const collectionPhotos = pgTable(
  'collection_photos',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.photoId] }),
    // "which collections contain this photo"
    index('collection_photos_photo_id_idx').on(t.photoId),
  ]
)

export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
export type HiddenPhoto = typeof hiddenPhotos.$inferSelect
export type NewHiddenPhoto = typeof hiddenPhotos.$inferInsert
export type Collection = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert
export type CollectionPhoto = typeof collectionPhotos.$inferSelect
export type NewCollectionPhoto = typeof collectionPhotos.$inferInsert
