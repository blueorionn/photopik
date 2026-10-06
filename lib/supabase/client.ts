import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const createClient = () =>
  createBrowserClient(supabaseUrl!, supabaseKey!, {
    auth: {
      // ConfirmClient owns the exchange; auto-detection would consume it first.
      detectSessionInUrl: false,
      experimental: {
        // Stamps sb_flow_id onto the magic-link redirect URL so the
        // confirm page exchanges against THIS flow's verifier slot —
        // not the most recent one. Prevents stale-email clicks from
        // burning fresh links with a verifier mismatch.
        appendPkceFlowIdToRedirects: true,
      },
    },
  })
