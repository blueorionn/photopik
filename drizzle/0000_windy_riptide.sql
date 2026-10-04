CREATE TYPE "public"."photo_license" AS ENUM('reserved', 'public_domain', 'cc0_1_0', 'cc_by_3_0', 'cc_by_4_0', 'cc_by_sa_3_0', 'cc_by_sa_4_0', 'cc_by_nc_3_0', 'cc_by_nc_4_0', 'cc_by_nc_sa_3_0', 'cc_by_nc_sa_4_0', 'cc_by_nd_3_0', 'cc_by_nd_4_0', 'cc_by_nc_nd_3_0', 'cc_by_nc_nd_4_0');
CREATE TABLE "collection_photos" (
	"collection_id" uuid NOT NULL,
	"photo_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_photos_collection_id_photo_id_pk" PRIMARY KEY("collection_id","photo_id")
);

CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "hidden_photos" (
	"user_id" uuid NOT NULL,
	"photo_id" uuid NOT NULL,
	"hidden_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hidden_photos_user_id_photo_id_pk" PRIMARY KEY("user_id","photo_id")
);

CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"license" "photo_license" DEFAULT 'reserved' NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"upload_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"hash" text NOT NULL,
	"is_nsfw" boolean DEFAULT false NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "photos_dimensions_check" CHECK (width > 0 and height > 0),
	CONSTRAINT "photos_file_size_check" CHECK (file_size > 0)
);

ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collection_photos" ADD CONSTRAINT "collection_photos_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "hidden_photos" ADD CONSTRAINT "hidden_photos_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "collection_photos_photo_id_idx" ON "collection_photos" USING btree ("photo_id");
CREATE UNIQUE INDEX "collections_slug_key" ON "collections" USING btree ("slug") WHERE deleted_at is null;
CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");
CREATE INDEX "collections_public_browse_idx" ON "collections" USING btree ("created_at" DESC NULLS LAST) WHERE is_private = false and deleted_at is null;
CREATE INDEX "hidden_photos_photo_id_idx" ON "hidden_photos" USING btree ("photo_id");
CREATE UNIQUE INDEX "photos_slug_key" ON "photos" USING btree ("slug") WHERE deleted_at is null;
CREATE UNIQUE INDEX "photos_storage_key_key" ON "photos" USING btree ("storage_key");
CREATE INDEX "photos_uploaded_by_idx" ON "photos" USING btree ("uploaded_by");
CREATE INDEX "photos_hash_idx" ON "photos" USING btree ("hash");
CREATE INDEX "photos_public_feed_idx" ON "photos" USING btree ("upload_time" DESC NULLS LAST) WHERE is_private = false and deleted_at is null;

-- ============================================================
-- Hand-written section: cross-schema FKs + updated_at + RLS
-- ============================================================

-- FKs to Supabase-managed auth.users (cross-schema; not expressible from drizzle)
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_auth_users_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "hidden_photos" ADD CONSTRAINT "hidden_photos_user_id_auth_users_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_auth_users_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- updated_at maintenance
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER "photos_set_updated_at" BEFORE UPDATE ON "photos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "collections_set_updated_at" BEFORE UPDATE ON "collections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Row Level Security: default-deny until a policy matches
ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hidden_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collection_photos" ENABLE ROW LEVEL SECURITY;

-- photos: public rows visible to everyone (incl. anon); owners see all their own rows
CREATE POLICY "photos_select" ON "photos" FOR SELECT TO anon, authenticated USING ((is_private = false AND deleted_at IS NULL) OR uploaded_by = auth.uid());
-- TODO(M2): add OR is_staff() once user_roles + the access-token hook exist

-- photos: insert only as yourself
CREATE POLICY "photos_insert" ON "photos" FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- photos: update (incl. soft-delete) and delete your own rows only
CREATE POLICY "photos_update" ON "photos" FOR UPDATE TO authenticated USING (uploaded_by = auth.uid()) WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "photos_delete" ON "photos" FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- hidden_photos: strictly per-user — everyone manages only their own mutes
CREATE POLICY "hidden_photos_select" ON "hidden_photos" FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "hidden_photos_insert" ON "hidden_photos" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "hidden_photos_update" ON "hidden_photos" FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "hidden_photos_delete" ON "hidden_photos" FOR DELETE TO authenticated USING (user_id = auth.uid());

-- collections: same shape as photos — public rows for everyone, owners see all their own
CREATE POLICY "collections_select" ON "collections" FOR SELECT TO anon, authenticated USING ((is_private = false AND deleted_at IS NULL) OR user_id = auth.uid());
-- TODO(M2): add OR is_staff()

CREATE POLICY "collections_insert" ON "collections" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "collections_update" ON "collections" FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "collections_delete" ON "collections" FOR DELETE TO authenticated USING (user_id = auth.uid());

-- collection_photos: visibility COMPOSES — a row is readable only when both
-- endpoints are readable by the viewer. The EXISTS subqueries run under the
-- viewer's own RLS context, so photos/collections policies do the deciding.
CREATE POLICY "collection_photos_select" ON "collection_photos" FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM "collections" c WHERE c.id = collection_id) AND EXISTS (SELECT 1 FROM "photos" p WHERE p.id = photo_id));
CREATE POLICY "collection_photos_insert" ON "collection_photos" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "collections" c WHERE c.id = collection_id AND c.user_id = auth.uid()) AND EXISTS (SELECT 1 FROM "photos" p WHERE p.id = photo_id));
CREATE POLICY "collection_photos_update" ON "collection_photos" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM "collections" c WHERE c.id = collection_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM "collections" c WHERE c.id = collection_id AND c.user_id = auth.uid()) AND EXISTS (SELECT 1 FROM "photos" p WHERE p.id = photo_id));
CREATE POLICY "collection_photos_delete" ON "collection_photos" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM "collections" c WHERE c.id = collection_id AND c.user_id = auth.uid()));
