'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  cursoId: string
}

export default function CourseActions({ cursoId }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer y eliminará todos sus módulos y contenidos asociados.')) {
      return
    }

    setIsDeleting(true)
    const res = await fetch(`/api/courses/${cursoId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      alert('Error al eliminar el curso')
      setIsDeleting(false)
      return
    }

    router.push('/contenido')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/contenido/${cursoId}/editar`}>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil size={14} />
          Editar
        </Button>
      </Link>
      <Button 
        variant="destructive" 
        size="sm" 
        className="gap-2" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 size={14} />
        {isDeleting ? 'Eliminando...' : 'Eliminar'}
      </Button>
    </div>
  )
}
