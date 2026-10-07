-- Auth-gated reads: remove the anon role from the three public SELECT
-- policies so only authenticated users can read anything. Bodies are
-- otherwise unchanged from 0000.
--
-- NOTE: once applied, logged-out visitors get an empty feed (RLS filters
-- silently) until the application-level redirect-to-login ships.

DROP POLICY "photos_select" ON "photos";
CREATE POLICY "photos_select" ON "photos" FOR SELECT TO authenticated USING ((is_private = false AND deleted_at IS NULL) OR uploaded_by = auth.uid());

DROP POLICY "collections_select" ON "collections";
CREATE POLICY "collections_select" ON "collections" FOR SELECT TO authenticated USING ((is_private = false AND deleted_at IS NULL) OR user_id = auth.uid());

DROP POLICY "collection_photos_select" ON "collection_photos";
CREATE POLICY "collection_photos_select" ON "collection_photos" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "collections" c WHERE c.id = collection_id) AND EXISTS (SELECT 1 FROM "photos" p WHERE p.id = photo_id));
