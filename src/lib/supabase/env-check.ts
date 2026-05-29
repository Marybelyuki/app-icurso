/** URL de API del proyecto (no el enlace del panel web). */
export function assertProjectApiUrl(url: string) {
  const u = url.trim()
  if (
    u.includes('supabase.com/dashboard') ||
    u.includes('/dashboard/project/')
  ) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL no puede ser la página del panel (…/dashboard/project/…). ' +
        'En Supabase → Settings → API copia **Project URL**, que tiene forma https://xxxx.supabase.co'
    )
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(u)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL debe ser https://TU_REF.supabase.co (Settings → API → Project URL).'
    )
  }
}

/**
 * Comprueba que la clave de servicio sea un JWT de Supabase con role service_role
 * y que el `ref` del token coincida con el subdominio de la URL (mismo proyecto).
 */
export function assertServiceKeyMatchesProject(supabaseUrl: string, serviceKey: string) {
  const parts = serviceKey.split('.')
  if (parts.length !== 3) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no parece un JWT (tres partes separadas por puntos). Cópiala entera desde Supabase → Settings → API.'
    )
  }

  let payload: { role?: string; ref?: string }
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = '='.repeat((4 - (b64.length % 4)) % 4)
    payload = JSON.parse(Buffer.from(b64 + pad, 'base64').toString('utf8')) as {
      role?: string
      ref?: string
    }
  } catch {
    throw new Error('No se pudo leer SUPABASE_SERVICE_ROLE_KEY. Revisa que no tenga saltos de línea ni espacios.')
  }

  if (payload.role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY no es la clave **service_role** (en el token aparece role: "${payload.role ?? '?'}"). ` +
        'En Supabase → Settings → API copia el secret **service_role**, no el de **anon public**.'
    )
  }

  const m = supabaseUrl.trim().match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i)
  if (m && payload.ref && payload.ref !== m[1]) {
    throw new Error(
      `La clave service_role es del proyecto "${payload.ref}" pero NEXT_PUBLIC_SUPABASE_URL es "${m[1]}". ` +
        'URL y claves deben ser del mismo proyecto (Settings → API).'
    )
  }
}
