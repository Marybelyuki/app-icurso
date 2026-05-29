'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isConfig =
    error.message.includes('SUPABASE') ||
    error.message.includes('NEXT_PUBLIC') ||
    error.message.includes('.env.local')

  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
        <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold mb-2">No se pudo cargar iCurs@</h1>
          {isConfig ? (
            <p className="text-sm text-slate-600 mb-4">
              Falta configurar Supabase en Vercel. Ve a{' '}
              <strong>Project → Settings → Environment Variables</strong> y añade:
              <code className="block mt-2 text-xs bg-slate-100 p-3 rounded-lg">
                NEXT_PUBLIC_SUPABASE_URL
                <br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY
                <br />
                SUPABASE_SERVICE_ROLE_KEY
              </code>
              Copia los mismos valores de tu <code>icursa/.env.local</code>, guarda y pulsa{' '}
              <strong>Redeploy</strong>.
            </p>
          ) : (
            <p className="text-sm text-slate-600 mb-4">
              Ocurrió un error en el servidor. Comprueba las variables de entorno en Vercel o
              revisa los logs del despliegue.
            </p>
          )}
          {error.digest && (
            <p className="text-xs text-slate-400 mb-4">Código: {error.digest}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium"
            >
              Reintentar
            </button>
            <a
              href="/api/health"
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium"
            >
              Diagnóstico
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
