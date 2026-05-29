'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ContentDevelopment, DevelopedTopic } from '@/types/content-development'

interface ContentDevelopmentClientProps {
  courseId: string
  courseName: string
  hasCartaDescriptiva: boolean
}

export default function ContentDevelopmentClient({
  courseId,
  courseName,
  hasCartaDescriptiva,
}: ContentDevelopmentClientProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [development, setDevelopment] = useState<ContentDevelopment | null>(null)
  const [activeTab, setActiveTab] = useState<'alineacion' | 'integracion' | 'recursos' | `tema-${number}`>('alineacion')

  const activeTopicIndex = activeTab.startsWith('tema-') ? Number(activeTab.replace('tema-', '')) : -1
  const activeTopic = activeTopicIndex >= 0 ? development?.topics[activeTopicIndex] : null

  async function generate() {
    setStatus('generating')
    setError('')

    try {
      const res = await fetch('/api/content-development/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo generar el desarrollo.')

      setDevelopment(data.development)
      setActiveTab('alineacion')
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  async function exportWord() {
    if (!development) return
    setExporting(true)
    setError('')
    try {
      const res = await fetch('/api/content-development/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName, development }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo generar el Word.')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Desarrollo de Contenido - ${courseName}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar Word')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col" style={{ background: '#f0f2f5' }}>
      <header className="relative px-5 py-4 text-center text-white shadow-lg" style={{ background: 'var(--gradient)' }}>
        <Link
          href={`/contenido/${courseId}`}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
        >
          <ArrowLeft size={16} />
          Regresar
        </Link>
        <h1 className="text-xl font-bold">Desarrollo de Contenido</h1>
        <p className="text-xs opacity-90">{courseName}</p>
        <span className="mt-2 inline-block rounded-full bg-yellow-300 px-3 py-0.5 text-xs font-bold text-blue-950">
          Generado desde la Carta Descriptiva
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr]">
        <aside className="overflow-y-auto border-r border-slate-300 bg-slate-50 p-3">
          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Acciones</p>
            <div className="space-y-2">
              <Button
                onClick={generate}
                disabled={!hasCartaDescriptiva || status === 'generating'}
                className="w-full justify-center text-white"
                style={{ background: 'var(--gradient)' }}
              >
                {status === 'generating' ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Sparkles size={16} className="mr-2" />
                )}
                {development ? 'Regenerar contenido' : 'Generar contenido'}
              </Button>

              <Button
                variant="outline"
                onClick={exportWord}
                disabled={!development || exporting}
                className="w-full justify-center"
              >
                {exporting ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
                {exporting ? 'Generando Word...' : 'Descargar Word (.docx)'}
              </Button>
            </div>
          </div>

          {!hasCartaDescriptiva && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Primero genera la Carta Descriptiva en Formatos.
            </div>
          )}

          <p className="mb-2 border-b-2 border-blue-700 pb-1 text-sm font-bold text-blue-900">Secciones</p>
          <nav className="space-y-2">
            <SideButton active={activeTab === 'alineacion'} onClick={() => setActiveTab('alineacion')}>
              Alineación instruccional
            </SideButton>
            {development?.topics.map((topic, index) => (
              <SideButton
                key={`${topic.title}-${index}`}
                active={activeTab === `tema-${index}`}
                onClick={() => setActiveTab(`tema-${index}`)}
              >
                Tema {index + 1}: {topic.title}
              </SideButton>
            ))}
            <SideButton active={activeTab === 'integracion'} onClick={() => setActiveTab('integracion')} disabled={!development}>
              Integración final
            </SideButton>
            <SideButton active={activeTab === 'recursos'} onClick={() => setActiveTab('recursos')} disabled={!development}>
              Recursos para presentación
            </SideButton>
          </nav>
        </aside>

        <main className="min-w-0 overflow-y-auto bg-slate-200 p-4">
          <div className="mb-3 flex flex-wrap gap-2 rounded-lg bg-white p-2 shadow-sm">
            <TopTab active={activeTab === 'alineacion'} onClick={() => setActiveTab('alineacion')}>
              Alineación
            </TopTab>
            {development?.topics.map((_, index) => (
              <TopTab key={index} active={activeTab === `tema-${index}`} onClick={() => setActiveTab(`tema-${index}`)}>
                Tema {index + 1}
              </TopTab>
            ))}
            <TopTab active={activeTab === 'integracion'} onClick={() => setActiveTab('integracion')} disabled={!development}>
              Integración
            </TopTab>
            <TopTab active={activeTab === 'recursos'} onClick={() => setActiveTab('recursos')} disabled={!development}>
              Recursos
            </TopTab>
          </div>

          {status === 'generating' && (
            <div className="mx-auto flex min-h-[11in] max-w-[8.5in] items-center justify-center rounded-lg bg-white p-10 shadow">
              <div className="text-center">
                <Sparkles size={42} className="mx-auto mb-4 animate-pulse text-blue-700" />
                <h2 className="text-xl font-bold text-slate-900">Generando desarrollo del curso...</h2>
                <p className="mt-2 text-sm text-slate-600">
                  La IA está desarrollando los temas conforme a la Carta Descriptiva.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mx-auto max-w-[8.5in] rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {status !== 'generating' && !development && (
            <div className="mx-auto min-h-[11in] max-w-[8.5in] rounded-lg bg-white px-16 py-14 shadow">
              <div className="border-b-4 border-blue-900 pb-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-900">iCurs@</p>
                <h2 className="mt-4 text-3xl font-black uppercase text-slate-950">Desarrollo de Contenido</h2>
                <p className="mt-3 text-lg font-semibold text-blue-900">{courseName}</p>
              </div>
              <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm leading-7 text-slate-700">
                  Presiona <strong>Generar contenido</strong> para crear en pantalla el desarrollo completo del curso:
                  temas, subtemas, conceptos, diagramas Mermaid, ejemplos, prácticas, actividades, guion del expositor
                  y evidencias de evaluación.
                </p>
              </div>
            </div>
          )}

          {development && activeTab === 'alineacion' && <AlignmentPage development={development} />}
          {development && activeTopic && <TopicPage topic={activeTopic} index={activeTopicIndex} />}
          {development && activeTab === 'integracion' && <IntegrationPage development={development} />}
          {development && activeTab === 'recursos' && <ResourcesPage development={development} />}
        </main>
      </div>
    </div>
  )
}

function SideButton({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-md border px-3 py-2 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: active ? '#1e3c72' : '#fff',
        borderColor: active ? '#1e3c72' : '#dee2e6',
        color: active ? '#fff' : '#475569',
      }}
    >
      {children}
    </button>
  )
}

function TopTab({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-w-24 flex-1 rounded border-2 px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: active ? '#1e3c72' : '#f8f9fa',
        borderColor: active ? '#1e3c72' : '#dee2e6',
        color: active ? '#fff' : '#6c757d',
      }}
    >
      {children}
    </button>
  )
}

function DocumentShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto min-h-[11in] max-w-[8.5in] rounded-lg bg-white px-14 py-12 font-serif text-[10pt] leading-relaxed text-black shadow">
      <div className="mb-6 text-center">
        <div className="text-[14pt] font-bold uppercase text-blue-900">Desarrollo de Contenido</div>
        <h2 className="mt-2 text-[16pt] font-bold">{title}</h2>
      </div>
      {children}
    </article>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 border-b-2 border-blue-900 pb-1 text-[11pt] font-bold uppercase text-blue-900">{children}</h3>
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

function AlignmentPage({ development }: { development: ContentDevelopment }) {
  return (
    <DocumentShell title={development.course_title}>
      <SectionTitle>Objetivo General</SectionTitle>
      <p>{development.alignment.general_objective}</p>
      <SectionTitle>Objetivos Particulares</SectionTitle>
      <BulletList items={development.alignment.particular_objectives} />
      <SectionTitle>Congruencia Instruccional</SectionTitle>
      <BulletList items={development.alignment.instructional_alignment} />
    </DocumentShell>
  )
}

function TopicPage({ topic, index }: { topic: DevelopedTopic; index: number }) {
  return (
    <DocumentShell title={`Tema ${index + 1}: ${topic.title}`}>
      <SectionTitle>Subtemas</SectionTitle>
      <BulletList items={topic.subtopics} />

      <SectionTitle>Conceptos Clave</SectionTitle>
      <BulletList items={topic.key_concepts} />

      <SectionTitle>Desarrollo Conceptual</SectionTitle>
      {topic.conceptual_development.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className="mb-3 text-justify">
          {paragraph}
        </p>
      ))}

      <SectionTitle>Diagrama Mermaid</SectionTitle>
      <pre className="overflow-x-auto rounded border border-slate-300 bg-slate-50 p-3 font-mono text-[8.5pt] whitespace-pre-wrap">
        {topic.mermaid_diagram}
      </pre>

      <SectionTitle>Ejemplos</SectionTitle>
      <BulletList items={topic.examples} />

      <SectionTitle>Ejemplos Prácticos</SectionTitle>
      <BulletList items={topic.practical_examples} />

      <SectionTitle>Práctica o Dinámica</SectionTitle>
      <p>{topic.practice}</p>

      <SectionTitle>Guion Sugerido para el Expositor</SectionTitle>
      <p>{topic.facilitator_script}</p>

      <SectionTitle>Actividad de Aprendizaje</SectionTitle>
      <p>{topic.learning_activity}</p>

      <SectionTitle>Evaluación y Evidencias Observables</SectionTitle>
      <BulletList items={topic.evaluation_evidence} />

      <SectionTitle>Errores Frecuentes y Recomendaciones</SectionTitle>
      <BulletList items={topic.common_errors} />
    </DocumentShell>
  )
}

function IntegrationPage({ development }: { development: ContentDevelopment }) {
  return (
    <DocumentShell title="Integración Final del Curso">
      <SectionTitle>Recapitulación</SectionTitle>
      <p>{development.integration.recap}</p>
      <SectionTitle>Práctica Integradora</SectionTitle>
      <p>{development.integration.integrative_practice}</p>
      <SectionTitle>Criterios para Verificar el Logro de Objetivos</SectionTitle>
      <BulletList items={development.integration.objective_verification_criteria} />
    </DocumentShell>
  )
}

function ResourcesPage({ development }: { development: ContentDevelopment }) {
  return (
    <DocumentShell title="Banco de Recursos para Presentación">
      <SectionTitle>Frases Clave para Diapositivas</SectionTitle>
      <BulletList items={development.presentation_resources.slide_key_phrases} />
      <SectionTitle>Ideas de Esquemas Visuales</SectionTitle>
      <BulletList items={development.presentation_resources.visual_scheme_ideas} />
      <SectionTitle>Preguntas Detonadoras</SectionTitle>
      <BulletList items={development.presentation_resources.trigger_questions} />
    </DocumentShell>
  )
}
