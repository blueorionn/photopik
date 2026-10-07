import type { Photo } from '@/lib/db/schema'

/**
 * Licenses permitted on the public gallery (homepage feed, scroll mode,
 * search): those that allow commercial display of the photo as-is.
 *
 * Deliberately excluded:
 *  - `reserved` (all rights reserved — no public display permission)
 *  - all `cc_by_nc_*` variants (NonCommercial)
 *
 * ND variants are INCLUDED: they forbid derivatives, not display.
 */
export const PUBLIC_FEED_LICENSES: readonly Photo['license'][] = [
  'public_domain',
  'cc0_1_0',
  'cc_by_3_0',
  'cc_by_4_0',
  'cc_by_sa_3_0',
  'cc_by_sa_4_0',
  'cc_by_nd_3_0',
  'cc_by_nd_4_0',
]
