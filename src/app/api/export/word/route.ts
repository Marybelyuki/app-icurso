import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildModuleWord } from '@/lib/export/word'
import type { Curso, Modulo, ContentBlock } from '@/types/curso'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('moduleId')

  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
  }

  const [modData, blocksData] = await Promise.all([
    supabase.from('modules').select('*, courses(*)').eq('id', moduleId).single(),
    supabase.from('content_blocks').select('*').eq('module_id', moduleId).order('order'),
  ])

  if (modData.error || !modData.data) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const modulo = modData.data as Modulo
  const curso = (modData.data as Record<string, unknown>).courses as Curso
  const blocks = (blocksData.data ?? []) as ContentBlock[]

  const docBuffer = await buildModuleWord(curso, modulo, blocks)

  return new NextResponse(docBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${modulo.title}.docx"`,
    },
  })
}
