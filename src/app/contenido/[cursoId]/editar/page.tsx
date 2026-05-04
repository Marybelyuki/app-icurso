import { getCourseById } from '@/lib/db/queries'
import { notFound } from 'next/navigation'
import EditCourseForm from './EditCourseForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ cursoId: string }>
}

export default async function EditarCursoPage({ params }: Props) {
  const { cursoId } = await params
  const curso = await getCourseById(cursoId)

  if (!curso) notFound()

  return <EditCourseForm curso={curso} />
}
