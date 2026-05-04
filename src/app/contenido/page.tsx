import { getCourses } from '@/lib/db/queries'
import CursoCard from '@/components/cursos/CursoCard'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import type { Curso } from '@/types/curso'

export const dynamic = 'force-dynamic'

function groupByCategory(courses: Curso[]): Record<string, Curso[]> {
  return courses.reduce<Record<string, Curso[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})
}

export default async function ContenidoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; instructor?: string; category?: string }>
}) {
  const params = await searchParams
  const query = params.q?.toLowerCase() ?? ''
  const instructorFilter = params.instructor ?? ''
  const categoryFilter = params.category ?? ''

  const allCourses = await getCourses()

  const filtered = allCourses.filter((c) => {
    const matchesQ = !query || c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query)
    const matchesInstructor = !instructorFilter || c.instructor === instructorFilter
    const matchesCategory = !categoryFilter || c.category === categoryFilter
    return matchesQ && matchesInstructor && matchesCategory
  })

  const grouped = groupByCategory(filtered)
  const categories = Object.keys(grouped).sort()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'var(--gradient)' }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}>
              Catálogo de Cursos
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {allCourses.length} cursos disponibles
            </p>
          </div>
        </div>
        <Link
          href="/contenido/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--gradient)' }}
        >
          <Plus size={16} />
          Nuevo curso
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-6" method="GET">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar cursos..."
          className="border rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px] outline-none focus:ring-2"
          style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text)' }}
        />
        <select
          name="instructor"
          defaultValue={params.instructor}
          className="border rounded-xl px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text)' }}
        >
          <option value="">Todos los instructores</option>
          <option value="MARIBEL">Maribel</option>
          <option value="CESAR">César</option>
          <option value="AMBOS">Ambos</option>
        </select>
        <select
          name="category"
          defaultValue={params.category}
          className="border rounded-xl px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text)' }}
        >
          <option value="">Todas las categorías</option>
          {[...new Set(allCourses.map((c) => c.category))].sort().map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          Filtrar
        </button>
        {(query || instructorFilter || categoryFilter) && (
          <Link
            href="/contenido"
            className="px-4 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Grid by category */}
      {categories.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No se encontraron cursos</p>
          <p className="text-sm mt-1">Intenta con otros filtros o crea un curso nuevo</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h2
                className="text-sm font-bold uppercase tracking-wider mb-3 px-1"
                style={{ color: 'var(--primary)', fontFamily: 'var(--font-montserrat)' }}
              >
                {category}
                <span
                  className="ml-2 normal-case text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(30,60,114,0.08)', color: 'var(--primary)' }}
                >
                  {grouped[category].length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {grouped[category].map((curso) => (
                  <CursoCard key={curso.id} curso={curso} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
