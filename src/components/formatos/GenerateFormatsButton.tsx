'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GenerateFormatsButton({
  courseId,
  mode = 'generate',
}: {
  courseId: string
  mode?: 'generate' | 'regenerate'
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/formats/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (!res.ok) {
        let backendError = 'Error al generar formatos con IA.'
        try {
          const payload = await res.json()
          if (payload?.error && typeof payload.error === 'string') {
            backendError = payload.error
          }
        } catch {
          // Ignore JSON parse errors and fallback to generic message
        }
        throw new Error(backendError)
      }
      
      // Forzar recarga desde el lado de Next para que identifique la variable e inyecte el iFrame
      router.refresh()
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Hubo un fallo en la generación con OpenAI.'
      alert(`Error al generar formatos:\n${message}`)
      setLoading(false)
    }
  }

  if (mode === 'regenerate') {
    return (
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="h-10 px-4 text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-white"
        style={{ background: 'var(--gradient)', borderRadius: '10px', fontWeight: 'bold' }}
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerando...</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" /> Regenerar con IA</>
        )}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full bg-slate-50 pt-24">
      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200/60 w-full max-w-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Sparkles size={200} />
        </div>
        
        <Sparkles size={42} className="mx-auto mb-5 text-[#6c3fc5]" />
        
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}>
          Construir Motor de Formatos
        </h2>
        
        <p className="text-sm leading-relaxed mb-8 text-left p-4 bg-slate-50 rounded-xl" style={{ color: 'var(--muted)' }}>
          📚 <strong>Proceso Asistido:</strong> Al apretar procesar, nuestra I.A. instruccional leerá automáticamente los módulos de este curso para desglosar su temario maestro, postular objetivos (cognitivos y psicomotores), y <strong>redactar un cuestionario completo de 20 reactivos estandarizados</strong> basados en la materia.
          <br/><br/>
          <span className="opacity-75 block text-xs font-semibold uppercase">⏱️ Este proceso toma ~60 segundos. Recomendado en conexiones estables.</span>
        </p>

        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full h-14 text-[0.95em] shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: 'var(--gradient)', borderRadius: '12px', fontWeight: 'bold' }}
        >
          {loading ? (
            <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Sintetizando Curso desde 0 ...</>
          ) : (
            <><Sparkles className="mr-3 h-5 w-5" /> Iniciar Generación Inteligente (IA)</>
          )}
        </Button>
      </div>
    </div>
  )
}
