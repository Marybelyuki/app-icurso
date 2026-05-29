import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { assertProjectApiUrl, assertServiceKeyMatchesProject } from '@/lib/supabase/env-check'

/**
 * Cliente servidor con **service role**: consultas admin a Postgres/Storage.
 *
 * No usar `createServerClient` (@supabase/ssr) con la service key: mezcla el flujo
 * de cookies de Auth y dispara GoTrue → `AuthApiError: Invalid API key`.
 */
export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error(
      'Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en icursa/.env.local'
    )
  }
  assertProjectApiUrl(url)
  assertServiceKeyMatchesProject(url, key)
  return createSupabaseJsClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
