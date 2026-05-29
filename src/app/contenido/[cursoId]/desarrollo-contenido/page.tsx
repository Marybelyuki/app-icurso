import { notFound } from 'next/navigation'
import {
  getCourseById,
  getCourseFormat,
} from '@/lib/db/queries'
import ContentDevelopmentClient from '@/components/contenido/ContentDevelopmentClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ cursoId: string }>
}

export default async function DesarrolloContenidoPage({ params }: Props) {
  const { cursoId } = await params

  const [curso, format] = await Promise.all([
    getCourseById(cursoId),
    getCourseFormat(cursoId),
  ])

  if (!curso) notFound()

  return (
    <ContentDevelopmentClient
      courseId={cursoId}
      courseName={curso.name}
      hasCartaDescriptiva={Boolean(format?.objectives?.ai_payload)}
    />
  )
}
