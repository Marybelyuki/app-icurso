'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, FileText, Database, ChevronLeft, ChevronRight, PenLine } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const courseMatch = pathname.match(/\/(?:contenido|formatos)\/([a-zA-Z0-9-_]+)/)
  const currentCourseId = courseMatch && courseMatch[1] !== 'nuevo' ? courseMatch[1] : null

  const navItems = [
    { href: '/contenido', label: 'Catálogo', icon: BookOpen },
    ...(currentCourseId ? [
      { href: `/contenido/${currentCourseId}/desarrollo-contenido`, label: 'Desarrollo de Contenido', icon: PenLine },
      { href: `/formatos/${currentCourseId}`, label: 'Formatos', icon: FileText },
      { href: `/contenido/${currentCourseId}/conocimiento`, label: 'Conocimiento', icon: Database },
    ] : [])
  ]

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0"
      style={{
        width: collapsed ? '72px' : '260px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <div
            className="text-xl font-bold px-3 py-1.5 rounded-lg text-white"
            style={{ background: 'var(--gradient)', fontFamily: 'var(--font-montserrat)' }}
          >
            iCurs@
          </div>
        )}
        {collapsed && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto"
            style={{ background: 'var(--gradient)' }}
          >
            iC
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors ml-auto"
          style={{ color: 'var(--muted)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150"
              style={{
                color: active ? 'var(--primary)' : 'var(--muted)',
                background: active ? 'rgba(30, 60, 114, 0.08)' : 'transparent',
                fontFamily: 'var(--font-inter)',
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
