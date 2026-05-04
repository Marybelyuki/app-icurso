'use client'

import { useEffect, useRef } from 'react'

interface StreamingTextProps {
  text: string
}

export default function StreamingText({ text }: StreamingTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [text])

  return (
    <div
      ref={ref}
      className="font-mono text-xs p-4 rounded-xl overflow-y-auto max-h-48 whitespace-pre-wrap leading-relaxed"
      style={{ background: '#0f172a', color: '#94a3b8' }}
    >
      {text || <span className="opacity-40">Esperando respuesta de Claude...</span>}
      {text && <span className="inline-block w-2 h-3 ml-0.5 animate-pulse" style={{ background: '#6C3FC5' }} />}
    </div>
  )
}
