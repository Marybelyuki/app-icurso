'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import StreamingText from './StreamingText'
import type { Modulo } from '@/types/curso'

interface ContentGeneratorProps {
  modulo: Modulo
  courseName: string
  knowledgeContext?: string
  onComplete: () => void
}

export default function ContentGenerator({
  modulo,
  courseName,
  knowledgeContext,
  onComplete,
}: ContentGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [streamText, setStreamText] = useState('')
  const [progress, setProgress] = useState(0)
  const [showLog, setShowLog] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [showRegenForm, setShowRegenForm] = useState(false)

  async function generate(instructions?: string) {
    setStatus('generating')
    setStreamText('')
    setProgress(5)
    setErrorMsg('')

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: modulo.id,
          courseName,
          moduleTitle: modulo.title,
          objectives: modulo.objectives,
          knowledgeContext,
          additionalInstructions: instructions,
        }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'chunk') {
                setStreamText((prev) => prev + event.content)
                setProgress((p) => Math.min(p + 1, 90))
              } else if (event.type === 'done') {
                setProgress(100)
                setStatus('done')
                onComplete()
                setShowRegenForm(false)
              } else if (event.type === 'error') {
                setErrorMsg(event.message)
                setStatus('error')
              }
            } catch {
              // ignore parse errors for partial SSE
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Generate button */}
      {status === 'idle' && !modulo.generated && (
        <Button
          onClick={() => generate()}
          className="w-full text-white font-semibold py-3"
          style={{ background: 'var(--gradient)' }}
        >
          <Sparkles size={18} className="mr-2" />
          Generar contenido con IA
        </Button>
      )}

      {/* Regenerate */}
      {(status === 'idle' || status === 'done') && modulo.generated && (
        <div>
          <Button
            variant="outline"
            onClick={() => setShowRegenForm(!showRegenForm)}
            className="w-full"
          >
            <RefreshCw size={16} className="mr-2" />
            Regenerar contenido
          </Button>
          {showRegenForm && (
            <div className="mt-3 space-y-2">
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Instrucciones adicionales para la regeneración (opcional)..."
                rows={3}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: 'var(--border)' }}
              />
              <Button
                onClick={() => generate(additionalInstructions)}
                className="text-white"
                style={{ background: 'var(--gradient)' }}
                size="sm"
              >
                <Sparkles size={14} className="mr-1.5" />
                Regenerar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {status === 'generating' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Generando contenido con Claude...
            </span>
          </div>
          <Progress value={progress} className="h-2" />

          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--muted)' }}
          >
            {showLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showLog ? 'Ocultar' : 'Ver'} respuesta en tiempo real
          </button>

          {showLog && <StreamingText text={streamText} />}
        </div>
      )}

      {/* Success */}
      {status === 'done' && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(39,174,96,0.08)', color: 'var(--success)' }}
        >
          <Sparkles size={16} />
          Contenido generado y guardado exitosamente
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="space-y-2">
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(231,76,60,0.08)', color: 'var(--destructive)' }}
          >
            Error: {errorMsg}
          </div>
          <Button variant="outline" size="sm" onClick={() => generate()}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  )
}
