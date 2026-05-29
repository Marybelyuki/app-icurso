import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function envStatus() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ] as const

  const missing = required.filter((key) => !process.env[key]?.trim())
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const urlLooksValid = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)

  return {
    ok: missing.length === 0 && urlLooksValid,
    missing,
    urlLooksValid,
    hint:
      missing.length > 0
        ? 'Añade las variables en Vercel → Project → Settings → Environment Variables y vuelve a desplegar.'
        : !urlLooksValid
          ? 'NEXT_PUBLIC_SUPABASE_URL debe ser https://TU_REF.supabase.co (Settings → API en Supabase).'
          : 'Variables presentes. Si la app sigue fallando, revisa que las claves coincidan con el mismo proyecto Supabase.',
  }
}

export async function GET() {
  const status = envStatus()
  return NextResponse.json(status, { status: status.ok ? 200 : 503 })
}
