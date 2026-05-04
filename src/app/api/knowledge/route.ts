import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // 1. Get the file metadata to know the path
  const { data: item } = await supabase.from('knowledge_base').select('file_path').eq('id', id).single()

  // 2. Delete from relational DB
  const { error } = await supabase.from('knowledge_base').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 3. Delete from physical bucket
  if (item?.file_path) {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const serviceSupabase = await createServiceClient()
    await serviceSupabase.storage.from('knowledge-files').remove([item.file_path])
  }

  return NextResponse.json({ success: true })
}
