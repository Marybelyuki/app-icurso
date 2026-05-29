import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()

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

  if (item?.file_path) {
    await supabase.storage.from('knowledge-files').remove([item.file_path])
  }

  return NextResponse.json({ success: true })
}
