/** Post-proceso del JSON de formatos: quita café/receso, prefijo "A ", espacios rotos y Amazon. */

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isCoffeeOrBreakLabel(txt: unknown): boolean {
  const s = String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!s) return false
  return (
    /\breceso\b/.test(s) ||
    /\bpausa\s*(programada|activa|breve)?\b/.test(s) ||
    /\bservicio\s+de\s+cafe\b/.test(s) ||
    /\bcafe(teria)?\b/.test(s) ||
    /\bcoffee\s*(break)?\b/.test(s)
  )
}

function stripLeadingListMarker(text: string): string {
  let t = String(text || '').trim()
  for (let i = 0; i < 4; i++) {
    const next = t
      .replace(/^[•●*\-\u2013\u2014]+\s*/g, '')
      .replace(/^[A-Z][\.\)]\s+/i, '')
      .replace(/^A\s+/i, '')
      .trim()
    if (next === t) break
    t = next
  }
  return t
}

function fixReadableSpaces(text: string): string {
  let s = String(text || '')
  // Proteger URLs antes de reglas de puntuación
  const urls: string[] = []
  s = s.replace(/https?:\/\/[^\s<>"']+/gi, (m) => {
    const i = urls.length
    urls.push(m.replace(/\s+/g, ''))
    return `\uE000${i}\uE001`
  })
  s = s.replace(/([A-Za-zÁÉÍÓÚÜáéíóúüñÑ0-9])([«"“])/g, '$1 $2')
  s = s.replace(/([»"”])([A-Za-zÁÉÍÓÚÜáéíóúüñÑ0-9])/g, '$1 $2')
  s = s.replace(/curso\s*[«"“]/gi, 'curso «')
  // Español: sin espacio tras ¿ ¡ ; sin espacio antes de ? !
  s = s.replace(/([¿¡])\s+/g, '$1')
  s = s.replace(/\s+([?!])/g, '$1')
  s = s.replace(/([?!])([A-Za-zÁÉÍÓÚÜáéíóúüñÑ])/g, '$1 $2')
  s = s.replace(/\.([A-ZÁÉÍÓÚÜÑ])/g, '. $1')
  // Espacios alrededor de negritas en HTML de la IA
  s = s.replace(/(<\/(?:strong|b)>)(?=[A-Za-zÁÉÍÓÚÜáéíóúüñÑ«"“])/gi, '$1 ')
  s = s.replace(/([A-Za-zÁÉÍÓÚÜáéíóúüñÑ0-9»"”])(<(?:strong|b)>)/gi, '$1 $2')
  s = s.replace(/<li([^>]*)>\s*A[\.\)]?\s+/gi, '<li$1>')
  s = s.replace(/<li([^>]*)>\s*[•●*]+\s*/gi, '<li$1>')
  s = s.replace(/\uE000(\d+)\uE001/g, (_, i) => urls[Number(i)] || '')
  return s
}

function scrubString(value: string): string {
  let s = fixReadableSpaces(value)
  // Si es ítem corto de lista (no HTML), quitar "A "
  if (!s.includes('<')) {
    s = stripLeadingListMarker(s)
  }
  return s.replace(/\s+/g, ' ').trim()
}

function stripCoffeeFromModules(data: Record<string, unknown>): void {
  if (!Array.isArray(data.modulos)) return
  data.modulos = data.modulos
    .filter((m) => m && typeof m === 'object' && !isCoffeeOrBreakLabel((m as Record<string, unknown>).titulo))
    .map((m) => {
      const mod = { ...(m as Record<string, unknown>) }
      const seq = mod.secuencia_didactica
      if (Array.isArray(seq)) {
        mod.secuencia_didactica = seq.filter(
          (b) => b && typeof b === 'object' && !isCoffeeOrBreakLabel((b as Record<string, unknown>).nombre_bloque)
        )
      }
      return mod
    })
}

function scrubObjetivosTemas(data: Record<string, unknown>): void {
  const op = data.objetivos_particulares
  if (!op || typeof op !== 'object') return
  for (const dom of ['cognitivo', 'psicomotor', 'afectivo'] as const) {
    const block = (op as Record<string, unknown>)[dom]
    if (!block || typeof block !== 'object') continue
    const temas = (block as Record<string, unknown>).temas
    if (!Array.isArray(temas)) continue
    const seen = new Set<string>()
    ;(block as Record<string, unknown>).temas = temas
      .map((t) => stripLeadingListMarker(scrubString(String(t || ''))))
      .filter((t) => {
        if (!t || isCoffeeOrBreakLabel(t)) return false
        const k = normalizeKey(t)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
  }
}

function scrubManualParticipante(data: Record<string, unknown>): void {
  const mp = data.manual_participante
  if (!Array.isArray(mp)) return
  data.manual_participante = mp.map((section) => {
    if (!section || typeof section !== 'object') return section
    const s = { ...(section as Record<string, unknown>) }
    const titulo = String(s.titulo || '')
    const key = normalizeKey(titulo)
    if (Array.isArray(s.contenido)) {
      s.contenido = (s.contenido as unknown[])
        .map((c) => scrubString(String(c || '')))
        .filter((c) => {
          if (!c) return false
          // En temario/componentes del MP, descartar líneas de café (la carta sí lo conserva en módulos)
          if ((key.includes('temario') || key.includes('componentes')) && isCoffeeOrBreakLabel(c)) return false
          return true
        })
    }
    return s
  })
}

/** Aplica limpiezas al payload. NO quita el receso de café de modulos (la carta descriptiva lo necesita). */
export function finalizeFormatPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const data = payload as Record<string, unknown>
  // Conservar Receso/CAFÉ en modulos[].secuencia_didactica → carta descriptiva
  scrubObjetivosTemas(data)
  scrubManualParticipante(data)
  return data
}
