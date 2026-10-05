# photopik

A quiet home for your photos — a curated photo gallery built on Next.js, Supabase, and CloudFront.

---

## Philosophy

Three decisions shape everything in this repository. Read them before contributing.

**1. Row Level Security is the security model, not a layer under the API.**
The deployed app holds no privileged database credential. Browser and server code query through `supabase-js` with the caller's identity (`anon` for visitors, `authenticated` for users), and Postgres RLS policies decide what exists for each request. A bug in application code cannot leak another user's data — the database refuses. The full-power Postgres connection exists **only** for running migrations, on a developer machine or CI. It is never deployed.

**2. An API exists only where privilege physically requires one.**
Presigned S3 uploads, CloudFront URL/cookie signing, role administration — these cannot run in a browser and will live in narrowly-scoped route handlers. Everything else (feeds, collections, mutes, edits) talks to Postgres directly under RLS. Fewer doors; each one deliberate.

**3. The PWA is installable but deliberately does not work offline.**
The service worker (Serwist/Turbopack) precaches only build assets and an offline fallback page. Navigations are network-only: no stale pages, no cached gallery, nothing user-specific ever in the service worker cache.

## Architecture

| Layer       | Choice                                                                                  |
| ----------- | --------------------------------------------------------------------------------------- |
| Framework   | Next.js 16                                                                              |
| Auth        | Supabase magic link (no passwords), PKCE; TOTP MFA required for staff roles _(planned)_ |
| Database    | Supabase Postgres — schema owned by Drizzle migrations                                  |
| Data access | `supabase-js` under RLS (see Philosophy)                                                |
| Media       | S3 + CloudFront                                                                         |
| UI          | Tailwind CSS v4 + shadcn/ui                                                             |
| Hosting     | Vercel                                                                                  |

### Visibility model

- `photos.is_private` — owner-only vs. public. Enforced by **RLS**.
- `photos.is_nsfw` — content rating. Filtered by the viewer's preference _(preferences table planned)_.
- `hidden_photos` — per-user "never show me this". Enforced by the feed query; strictly own-rows under RLS.
- `collections` — public/private shelves; `collection_photos` visibility **composes**: a row is visible only when both the collection _and_ the photo are visible to the viewer (postgres does this; see the policies in the migration).

## License

[Apache 2.0](./LICENSE)
