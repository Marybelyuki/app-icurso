import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildModuleHtml, renderPDF } from '@/lib/export/pdf'
import type { Curso, Modulo, ContentBlock } from '@/types/curso'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') ?? 'module'

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    let html = ''

    if (type === 'module') {
      const [modData, blocksData] = await Promise.all([
        supabase.from('modules').select('*, courses(*)').eq('id', id).single(),
        supabase.from('content_blocks').select('*').eq('module_id', id).order('order'),
      ])

      if (modData.error || !modData.data) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 })
      }

      const modulo = modData.data as Modulo
      const curso = (modData.data as Record<string, unknown>).courses as Curso
      const blocks = (blocksData.data ?? []) as ContentBlock[]

      html = buildModuleHtml(curso, modulo, blocks)
    } else {
      // Course PDF — concatenate all modules
      const courseData = await supabase.from('courses').select('*').eq('id', id).single()
      const modulesData = await supabase.from('modules').select('*').eq('course_id', id).order('number')

      if (courseData.error) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      const curso = courseData.data as Curso
      const modulos = (modulesData.data ?? []) as Modulo[]

      const sections = await Promise.all(
        modulos.map(async (mod) => {
          const { data: blocks } = await supabase
            .from('content_blocks')
            .select('*')
            .eq('module_id', mod.id)
            .order('order')
          return buildModuleHtml(curso, mod, (blocks ?? []) as ContentBlock[])
        })
      )

      html = sections.join('\n<div style="page-break-after:always"></div>\n')
    }

    const pdfBuffer = await renderPDF(html)

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="icursa-${type}-${id}.pdf"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PDF generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
