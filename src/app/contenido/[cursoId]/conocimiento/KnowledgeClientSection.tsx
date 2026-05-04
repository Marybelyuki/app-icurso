'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FileUploader from '@/components/conocimiento/FileUploader'
import LinkAdder from '@/components/conocimiento/LinkAdder'
import { FileText, Link2, Play, Trash2 } from 'lucide-react'
import type { KnowledgeItem } from '@/types/knowledge'

interface Props {
  courseId: string
  initialItems: KnowledgeItem[]
}

export default function KnowledgeClientSection({ courseId, initialItems }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)

  function refresh() {
    router.refresh()
  }

  async function deleteItem(id: string) {
    await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const typeIcon = (type: string) => {
    if (type === 'video') return <Play size={16} style={{ color: '#E63B8F' }} />
    if (type === 'link') return <Link2 size={16} style={{ color: 'var(--accent)' }} />
    return <FileText size={16} style={{ color: 'var(--primary)' }} />
  }

  return (
    <div className="space-y-6">
      <FileUploader courseId={courseId} onUploaded={refresh} />
      <LinkAdder courseId={courseId} onAdded={refresh} />

      {items.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Recursos ({items.length})
          </h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                {typeIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                  {item.url && (
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{item.url}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                  style={{ color: 'var(--destructive)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
