import { getCourseById, getCourseFormat } from '@/lib/db/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GenerateFormatsButton from '@/components/formatos/GenerateFormatsButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ cursoId: string }>
}

export default async function FormatosPage({ params }: Props) {
  const { cursoId } = await params
  
  const [curso, format] = await Promise.all([
     getCourseById(cursoId),
     getCourseFormat(cursoId)
  ])

  if (!curso) notFound()

  // Revisar si existe el JSON maestro generado por la IA en la DB
  const isGenerated = (format?.objectives?.ai_payload !== undefined && format?.objectives?.ai_payload !== null)

  return (
    <div className="flex flex-col h-screen w-full relative" style={{ background: 'var(--bg)' }}>
      <Link
        href={`/contenido/${cursoId}`}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-semibold shadow-md transition-transform hover:scale-105"
        style={{ color: 'var(--primary)' }}
      >
        <ArrowLeft size={16} />
        Regresar al curso
      </Link>
      
      {!isGenerated ? (
         <main className="flex-1 overflow-y-auto">
            <GenerateFormatsButton courseId={cursoId} />
         </main>
      ) : (
        <div className="relative h-full w-full">
          <div className="absolute top-4 right-4 z-40">
            <GenerateFormatsButton courseId={cursoId} mode="regenerate" />
          </div>
          <iframe 
            src={`/generador-formatos.html?cursoId=${cursoId}&curso=${encodeURIComponent(curso.name)}`} 
            className="w-full h-full border-none m-0 p-0 block bg-slate-50 relative z-20"
            sandbox="allow-scripts allow-downloads allow-same-origin allow-modals allow-popups"
          />
        </div>
      )}
    </div>
  )
}
