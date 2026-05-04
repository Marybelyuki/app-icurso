'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save } from 'lucide-react'

interface Props {
  courseId: string
  initialFormat: Record<string, unknown>
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{children}</label>
)

const Section = ({ title }: { title: string }) => (
  <div className="py-2 border-b mb-3 mt-4" style={{ borderColor: 'var(--border)' }}>
    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>{title}</p>
  </div>
)

export default function FormatosFormPanel({ courseId, initialFormat }: Props) {
  const gd = (initialFormat.general_data ?? {}) as Record<string, string>
  const obj = (initialFormat.objectives ?? {}) as Record<string, string>
  const ep = (initialFormat.evaluation_pcts ?? { diagnostica: 0, formativa: 60, sumativa: 40, criterio: '80% mínimo' }) as Record<string, string | number>
  const req = (initialFormat.requirements ?? {}) as Record<string, string>
  const ap = (initialFormat.apertura ?? {}) as Record<string, string>
  const ci = (initialFormat.cierre ?? {}) as Record<string, string>

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)?.value ?? ''

    const payload = {
      general_data: {
        instructor: get('instructor'),
        modalidad: get('modalidad'),
        lugar: get('lugar'),
        fecha: get('fecha'),
      },
      objectives: { general: get('obj_general') },
      evaluation_pcts: {
        diagnostica: parseInt(get('pct_diagnostica')) || 0,
        formativa: parseInt(get('pct_formativa')) || 60,
        sumativa: parseInt(get('pct_sumativa')) || 40,
        criterio: get('criterio'),
      },
      requirements: {
        escolaridad: get('escolaridad'),
        experiencia: get('experiencia'),
        materiales: get('materiales'),
        infraestructura: get('infraestructura'),
      },
      apertura: {
        bienvenida: get('bienvenida'),
        encuadre: get('encuadre'),
        diagnostica: get('ap_diagnostica'),
      },
      cierre: {
        sintesis: get('sintesis'),
        evaluacion: get('ev_cierre'),
        compromisos: get('compromisos'),
      },
    }

    await fetch('/api/formats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, ...payload }),
    })

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <Section title="Datos generales" />
      <div><Label>Instructor</Label><Input name="instructor" defaultValue={gd.instructor} placeholder="Nombre del instructor" /></div>
      <div><Label>Modalidad</Label><Input name="modalidad" defaultValue={gd.modalidad} placeholder="Presencial" /></div>
      <div><Label>Lugar</Label><Input name="lugar" defaultValue={gd.lugar} /></div>
      <div><Label>Fecha</Label><Input name="fecha" defaultValue={gd.fecha} placeholder="DD/MM/AAAA" /></div>

      <Section title="Objetivos" />
      <div><Label>Objetivo general</Label><Textarea name="obj_general" defaultValue={obj.general} rows={3} /></div>

      <Section title="Evaluación (%)" />
      <div className="grid grid-cols-3 gap-2">
        <div><Label>Diagnóstica</Label><Input name="pct_diagnostica" type="number" defaultValue={ep.diagnostica as number} /></div>
        <div><Label>Formativa</Label><Input name="pct_formativa" type="number" defaultValue={ep.formativa as number} /></div>
        <div><Label>Sumativa</Label><Input name="pct_sumativa" type="number" defaultValue={ep.sumativa as number} /></div>
      </div>
      <div><Label>Criterio acreditación</Label><Input name="criterio" defaultValue={ep.criterio as string} placeholder="80% mínimo" /></div>

      <Section title="Requisitos" />
      <div><Label>Escolaridad</Label><Input name="escolaridad" defaultValue={req.escolaridad} /></div>
      <div><Label>Experiencia</Label><Input name="experiencia" defaultValue={req.experiencia} /></div>
      <div><Label>Materiales</Label><Input name="materiales" defaultValue={req.materiales} /></div>
      <div><Label>Infraestructura</Label><Input name="infraestructura" defaultValue={req.infraestructura} /></div>

      <Section title="Apertura" />
      <div><Label>Bienvenida</Label><Textarea name="bienvenida" defaultValue={ap.bienvenida} rows={2} /></div>
      <div><Label>Encuadre</Label><Textarea name="encuadre" defaultValue={ap.encuadre} rows={2} /></div>
      <div><Label>Diagnóstica apertura</Label><Textarea name="ap_diagnostica" defaultValue={ap.diagnostica} rows={2} /></div>

      <Section title="Cierre" />
      <div><Label>Síntesis</Label><Textarea name="sintesis" defaultValue={ci.sintesis} rows={2} /></div>
      <div><Label>Evaluación final</Label><Textarea name="ev_cierre" defaultValue={ci.evaluacion} rows={2} /></div>
      <div><Label>Compromisos</Label><Textarea name="compromisos" defaultValue={ci.compromisos} rows={2} /></div>

      <Button
        type="submit"
        className="w-full text-white mt-4"
        style={{ background: saved ? 'var(--success)' : 'var(--gradient)' }}
        disabled={saving}
      >
        <Save size={14} className="mr-2" />
        {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
