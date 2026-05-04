import { ExternalLink } from 'lucide-react'

interface Reference {
  id: string
  type: string
  title: string
  author?: string | null
  year?: string | null
  url?: string | null
  citation: string
}

interface ReferencesListProps {
  references: Reference[]
}

const typeColors: Record<string, { bg: string; text: string }> = {
  ley: { bg: 'rgba(30,60,114,0.1)', text: '#1E3C72' },
  norma: { bg: 'rgba(231,76,60,0.1)', text: '#E74C3C' },
  libro: { bg: 'rgba(39,174,96,0.1)', text: '#27AE60' },
  web: { bg: 'rgba(108,63,197,0.1)', text: '#6C3FC5' },
  dependencia: { bg: 'rgba(245,158,11,0.1)', text: '#D97706' },
  revista: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
}

export default function ReferencesList({ references }: ReferencesListProps) {
  if (references.length === 0) return null

  return (
    <div>
      <h3
        className="text-sm font-bold mb-3 uppercase tracking-wide"
        style={{ color: 'var(--primary)', fontFamily: 'var(--font-montserrat)' }}
      >
        Referencias bibliográficas
      </h3>
      <div className="space-y-2">
        {references.map((ref) => {
          const color = typeColors[ref.type] ?? typeColors.web
          return (
            <div
              key={ref.id}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg)' }}
            >
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                style={{ background: color.bg, color: color.text }}
              >
                {ref.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  {ref.citation}
                </p>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs mt-1 hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    <ExternalLink size={11} />
                    {ref.url}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
