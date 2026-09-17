import { createClient as createSupabaseJsClient, type SupabaseClient } from '@supabase/supabase-js'
import { assertProjectApiUrl, assertServiceKeyMatchesProject } from '@/lib/supabase/env-check'

type GlobalService = typeof globalThis & {
  /** Bump suffix when client options change so HMR no reutiliza un singleton viejo. */
  __icursaSupabaseServiceV2?: SupabaseClient
}

function isTransientConnectError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const name = err.name
  if (name === 'TimeoutError' || name === 'AbortError') return true
  const cause = (err as { cause?: { code?: string; message?: string; name?: string } }).cause
  const code = cause?.code ?? ''
  const msg = `${err.message} ${cause?.message ?? ''}`
  return (
    cause?.name === 'TimeoutError' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_HEADERS_TIMEOUT' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    /fetch failed|Connect Timeout|ECONNRESET|ETIMEDOUT|aborted|The operation was aborted/i.test(msg)
  )
}

/**
 * Undici en Windows a veces agota ~10s al conectar a Cloudflare/Supabase.
 * En GET/HEAD cortamos antes (~4.5s) y reintentamos; en POST/uploads no limitamos.
 */
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  const budgetMs = method === 'GET' || method === 'HEAD' ? 4500 : undefined
  const maxAttempts = 3
  let lastErr: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const userSignal = init?.signal
    if (userSignal?.aborted) throw userSignal.reason ?? new DOMException('Aborted', 'AbortError')

    const budgetSignal = budgetMs != null ? AbortSignal.timeout(budgetMs) : null
    const signal =
      userSignal && budgetSignal
        ? AbortSignal.any([userSignal, budgetSignal])
        : (userSignal ?? budgetSignal ?? undefined)

    try {
      return await fetch(input, signal ? { ...init, signal } : init)
    } catch (err) {
      lastErr = err
      const abortedByUser = Boolean(userSignal?.aborted)
      if (abortedByUser || !isTransientConnectError(err) || attempt === maxAttempts) {
        throw err
      }
      // Abort por presupuesto de conexión también cuenta como transitorio
      await new Promise((r) => setTimeout(r, 150 * attempt))
    }
  }
  throw lastErr
}

/**
 * Cliente servidor con **service role**: consultas admin a Postgres/Storage.
 *
 * No usar `createServerClient` (@supabase/ssr) con la service key: mezcla el flujo
 * de cookies de Auth y dispara GoTrue → `AuthApiError: Invalid API key`.
 *
 * Singleton: reutiliza conexiones HTTP y reduce timeouts intermitentes en Windows/dev.
 */
export async function createServiceClient() {
  const g = globalThis as GlobalService
  if (g.__icursaSupabaseServiceV2) return g.__icursaSupabaseServiceV2

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error(
      'Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. ' +
        'En local: icursa/.env.local. En Vercel: Project → Settings → Environment Variables.'
    )
  }
  assertProjectApiUrl(url)
  assertServiceKeyMatchesProject(url, key)

  const client = createSupabaseJsClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchWithRetry,
    },
  })

  g.__icursaSupabaseServiceV2 = client
  return client
}
