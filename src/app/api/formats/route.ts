import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  const body = await request.json()
  const { courseId, general_data, objectives, evaluation_pcts, apertura, cierre, requirements } = body

  const { error } = await supabase.from('course_formats').upsert(
    {
      course_id: courseId,
      general_data,
      objectives,
      evaluation_pcts,
      apertura,
      cierre,
      requirements,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'course_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
