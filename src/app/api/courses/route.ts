import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  const body = await request.json()
  const { name, category, instructor, total_hours, description, norm_reference } = body

  if (!name || !category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({ name, category, instructor: instructor ?? 'AMBOS', total_hours: total_hours ?? 0, description, norm_reference })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
