'use client'

import { useEffect, useRef } from 'react'
import type { ContentBlock as ContentBlockType } from '@/types/curso'

interface Props {
  block: ContentBlockType
  onUpdate?: (id: string, content: Record<string, unknown>) => void
}

function TextBlock({ content, onUpdate, id }: { content: Record<string, unknown>; onUpdate?: Props['onUpdate']; id: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function handleBlur() {
    if (ref.current && onUpdate) {
      onUpdate(id, { html: ref.current.innerHTML })
    }
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className="prose prose-sm max-w-none outline-none focus:ring-2 focus:ring-blue-100 rounded-lg p-2 -m-2 transition-all"
      style={{ color: 'var(--text)' }}
      dangerouslySetInnerHTML={{ __html: (content.html as string) ?? '' }}
    />
  )
}

function TableBlock({ content }: { content: Record<string, unknown> }) {
  const headers = (content.headers as string[]) ?? []
  const rows = (content.rows as string[][]) ?? []
  const caption = content.caption as string | undefined

  return (
    <div className="overflow-x-auto">
      {caption && (
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>{caption}</p>
      )}
      <table className="w-full text-sm border-collapse rounded-xl overflow-hidden">
        <thead>
          <tr style={{ background: '#1E3C72' }}>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-white text-xs">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3" style={{ color: 'var(--text)' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DiagramBlock({ content }: { content: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null)
  const mermaidCode = (content.mermaid as string) ?? ''
  const caption = content.caption as string | undefined

  useEffect(() => {
    if (!ref.current || !mermaidCode) return

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor: '#1E3C72', primaryTextColor: '#fff' } })
      const id = `mermaid-${Math.random().toString(36).slice(2)}`
      mermaid.render(id, mermaidCode).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg
      }).catch(() => {
        if (ref.current) ref.current.innerHTML = `<pre class="text-xs p-2 bg-gray-100 rounded">${mermaidCode}</pre>`
      })
    })
  }, [mermaidCode])

  return (
    <div>
      {caption && (
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>{caption}</p>
      )}
      <div ref={ref} className="flex justify-center p-4 bg-gray-50 rounded-xl" />
    </div>
  )
}

function HighlightBlock({ content }: { content: Record<string, unknown> }) {
  const title = content.title as string | undefined
  const body = content.body as string ?? ''
  const variant = (content.variant as string) ?? 'info'

  const colors = {
    info: { border: 'var(--accent)', bg: 'rgba(108,63,197,0.05)' },
    warning: { border: 'var(--warning)', bg: 'rgba(245,158,11,0.05)' },
    success: { border: 'var(--success)', bg: 'rgba(39,174,96,0.05)' },
  }
  const { border, bg } = colors[variant as keyof typeof colors] ?? colors.info

  return (
    <div
      className="pl-4 pr-4 py-4 rounded-r-xl"
      style={{ borderLeft: `4px solid ${border}`, background: bg }}
    >
      {title && (
        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{title}</p>
      )}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{body}</p>
    </div>
  )
}

export default function ContentBlock({ block, onUpdate }: Props) {

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return <TextBlock content={block.content} onUpdate={onUpdate} id={block.id} />
      case 'table':
        return <TableBlock content={block.content} />
      case 'diagram':
      case 'schema':
        return <DiagramBlock content={block.content} />
      case 'highlight':
        return <HighlightBlock content={block.content} />
      case 'infographic':
        return (
          <div
            dangerouslySetInnerHTML={{ __html: (block.content.html as string) ?? '' }}
            className="rounded-xl overflow-hidden"
          />
        )
      default:
        return <pre className="text-xs p-3 bg-gray-50 rounded-xl">{JSON.stringify(block.content, null, 2)}</pre>
    }
  }

  const typeLabels: Record<string, string> = {
    text: 'Texto',
    table: 'Tabla',
    diagram: 'Diagrama',
    schema: 'Esquema',
    highlight: 'Destacado',
    infographic: 'Infografía',
    formula: 'Fórmula',
  }

  return (
    <div className="group relative">
      <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{ background: 'var(--border)', color: 'var(--muted)' }}
        >
          {typeLabels[block.type] ?? block.type}
        </span>
      </div>
      {renderContent()}
    </div>
  )
}
