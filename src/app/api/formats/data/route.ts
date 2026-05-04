import { NextRequest, NextResponse } from 'next/server'
import { getCourseFormat } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  }

  try {
    const format = await getCourseFormat(courseId)
    
    if (!format || !format.objectives?.ai_payload) {
        return NextResponse.json({ error: 'Not generated yet' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: format.objectives.ai_payload })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
