import type { PostgrestError } from '@supabase/supabase-js'

/** Lanza un error legible cuando PostgREST devuelve "Invalid API key" u otros fallos. */
export function throwQueryError(error: PostgrestError, context: string): never {
  const msg = error.message ?? ''

  if (msg.includes('Invalid API key')) {
    throw new Error(
      `Supabase rechazó la clave al ${context}. ` +
        'Abre https://supabase.com/dashboard → tu proyecto → Settings → API y vuelve a copiar la clave **service_role** ' +
        '(la secreta, no la anon) en SUPABASE_SERVICE_ROLE_KEY dentro de icursa/.env.local. ' +
        'Si en algún momento pulsaste "Regenerate JWT secret", todas las claves antiguas dejan de valer. Reinicia pnpm dev.'
    )
  }

  if (msg.includes('<!DOCTYPE') || msg.includes('<html')) {
    throw new Error(
      `La respuesta de Supabase no es JSON al ${context}: suele indicar que NEXT_PUBLIC_SUPABASE_URL es incorrecta ` +
        '(por ejemplo pegaste el enlace del panel en lugar de https://TU_REF.supabase.co). Settings → API → Project URL.'
    )
  }

  if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    const host = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? 'tu-proyecto.supabase.co'
    throw new Error(
      `No se pudo conectar con Supabase al ${context} (${host}). ` +
        'Comprueba en https://supabase.com/dashboard que el proyecto existe y no está pausado. ' +
        'Luego en Settings → API copia de nuevo **Project URL** y **service_role** a icursa/.env.local y reinicia pnpm dev. ' +
        'Si el proyecto fue eliminado, crea uno nuevo y ejecuta supabase/schema.sql.'
    )
  }

  throw new Error(msg)
}
