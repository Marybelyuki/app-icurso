import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateGammaPresentation } from '@/lib/export/gamma'
import type { Modulo } from '@/types/curso'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId } = await request.json()

  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
  }

  const [modData, blocksData] = await Promise.all([
    supabase.from('modules').select('*, courses(name)').eq('id', moduleId).single(),
    supabase.from('content_blocks').select('*').eq('module_id', moduleId).order('order'),
  ])

  if (modData.error || !modData.data) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const modulo = modData.data as Modulo & { courses: { name: string } }
  const blocks = blocksData.data ?? []

  // Extract key bullets from highlights
  const bullets = [
    ...modulo.objectives,
    ...blocks
      .filter((b) => b.type === 'highlight')
      .map((b) => (b.content as Record<string, string>).title ?? (b.content as Record<string, string>).body ?? '')
      .filter(Boolean)
      .slice(0, 5),
  ].slice(0, 8)

  const result = await generateGammaPresentation({
    title: modulo.title,
    bullets,
    courseContext: `Curso: ${modulo.courses.name}`,
  })

  return NextResponse.json(result)
}
