import type { getKnowledgeItems } from '@/lib/db/queries'

type KnowledgeList = Awaited<ReturnType<typeof getKnowledgeItems>>

export type FuenteRow = {
  titulo_obra: string
  autor_institucion: string
  url_o_referencia: string
  ano_publicacion: string
  ultima_reforma_consultada: string
  editorial: string
  pais_origen: string
}

const isMarketplaceUrl = (url: unknown) =>
  /amazon\.|amzn\.|mercadolibre\.|ebay\.|walmart\.|coppel\./i.test(String(url || ''))

const isMarketplaceTitle = (f: Record<string, unknown>) =>
  /amazon|mercado\s*libre|best\s*sellers?\s*online/i.test(
    `${f.titulo_obra || ''} ${f.editorial || ''} ${f.url_o_referencia || ''}`
  )

/** Documentos internos de diseño (carta/manual) que no deben citarse como bibliografía. */
const isInternalDesignDoc = (name: string) =>
  /\.(docx?|pptx?)$/i.test(name) &&
  /(carta\s*descriptiva|manual\s*del\s*(instructor|participante)|instrumento|evaluaci[oó]n|formato\s*oficial|plantilla)/i.test(
    name
  )

/** Títulos que son nombres de archivo, no obras bibliográficas. */
const looksLikeFilename = (title: string) =>
  /\.(docx?|pdf|pptx?|xlsx?|zip)$/i.test(String(title || '').trim())

const isPlaceholderFuente = (f: Record<string, unknown>) =>
  /base de conocimiento|iCurs@|Archivo en base|Equipo de diseño|Agrega libros/i.test(
    `${f.titulo_obra || ''} ${f.url_o_referencia || ''} ${f.editorial || ''} ${f.autor_institucion || ''}`
  )

const isProfessionalUrl = (url: string) =>
  /gob\.mx|dof\.gob|conocer\.gob|stps\.gob|imss\.gob|sat\.gob|ilo\.org|oit\.|un\.org|\.edu|org\/|harvard|oxford|sagepub|sciencedirect|who\.int|ops-oms|diputados\.gob|scjn\.gob|zendesk|hyken|forrester|briantracy|toister|hbr\.org|doi\.org/i.test(
    url
  )

type BiblioCatalogEntry = {
  match: RegExp
  fuente: FuenteRow
  unifyKey?: string
}

/**
 * Catálogo de citas reales: convierte nombres de archivo KB / temas
 * en referencias profesionales citables.
 */
const BIBLIO_CATALOG: BiblioCatalogEntry[] = [
  // —— NOM-035 / violencia y acoso laboral ——
  {
    match: /nom[\s_-]*035|nom035|factores\s*de\s*riesgo\s*psicosocial/i,
    unifyKey: 'nom-035-stps-2018',
    fuente: {
      titulo_obra:
        'NOM-035-STPS-2018, Factores de riesgo psicosocial en el trabajo — Identificación, análisis y prevención',
      autor_institucion: 'Secretaría del Trabajo y Previsión Social (STPS)',
      url_o_referencia:
        'https://www.dof.gob.mx/nota_detalle.php?codigo=5542676&fecha=23/10/2018',
      ano_publicacion: '2018',
      ultima_reforma_consultada: '2018',
      editorial: 'Diario Oficial de la Federación (DOF)',
      pais_origen: 'México',
    },
  },
  {
    match: /gu[ií]a.*(nom[\s_-]*035|035)|identificaci[oó]n.*riesgo\s*psicosocial/i,
    unifyKey: 'guia-nom-035-stps',
    fuente: {
      titulo_obra:
        'Guía de identificación de los factores de riesgo psicosocial y evaluación del entorno organizacional en los centros de trabajo (NOM-035-STPS-2018)',
      autor_institucion: 'Secretaría del Trabajo y Previsión Social (STPS)',
      url_o_referencia: 'https://www.gob.mx/stps/documentos/nom-035-stps-2018-factores-de-riesgo-psicosocial-en-el-trabajo-identificacion-analisis-y-prevencion',
      ano_publicacion: '2019',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'STPS',
      pais_origen: 'México',
    },
  },
  {
    match: /protocolo.*inspecci[oó]n|inspecci[oó]n\s*laboral/i,
    unifyKey: 'protocolo-inspeccion-stps',
    fuente: {
      titulo_obra: 'Protocolo de inspección laboral en materia de factores de riesgo psicosocial',
      autor_institucion: 'Secretaría del Trabajo y Previsión Social (STPS)',
      url_o_referencia: 'https://www.gob.mx/stps',
      ano_publicacion: '2020',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'STPS',
      pais_origen: 'México',
    },
  },
  {
    match: /convenio\s*190|c190|violencia\s*y\s*el\s*acoso|violence\s*and\s*harassment/i,
    unifyKey: 'oit-c190',
    fuente: {
      titulo_obra: 'Convenio sobre la violencia y el acoso, 2019 (núm. 190)',
      autor_institucion: 'Organización Internacional del Trabajo (OIT)',
      url_o_referencia: 'https://www.ilo.org/dyn/normlex/es/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C190',
      ano_publicacion: '2019',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'OIT',
      pais_origen: 'Suiza',
    },
  },
  {
    match: /recomendaci[oó]n\s*206|r206/i,
    unifyKey: 'oit-r206',
    fuente: {
      titulo_obra: 'Recomendación sobre la violencia y el acoso, 2019 (núm. 206)',
      autor_institucion: 'Organización Internacional del Trabajo (OIT)',
      url_o_referencia: 'https://www.ilo.org/dyn/normlex/es/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:R206',
      ano_publicacion: '2019',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'OIT',
      pais_origen: 'Suiza',
    },
  },
  {
    match: /ley\s*federal\s*del\s*trabajo|\blft\b/i,
    unifyKey: 'lft-dof',
    fuente: {
      titulo_obra: 'Ley Federal del Trabajo',
      autor_institucion: 'Congreso de los Estados Unidos Mexicanos',
      url_o_referencia: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
      ano_publicacion: '1970',
      ultima_reforma_consultada: '2024',
      editorial: 'Diario Oficial de la Federación (DOF)',
      pais_origen: 'México',
    },
  },
  {
    match: /acoso\s*(laboral|sexual)|violencia\s*laboral|hostigamiento/i,
    unifyKey: 'protocolo-acoso-stps',
    fuente: {
      titulo_obra:
        'Modelo de protocolo para prevenir, atender y erradicar la violencia laboral',
      autor_institucion: 'Secretaría del Trabajo y Previsión Social (STPS)',
      url_o_referencia: 'https://www.gob.mx/stps',
      ano_publicacion: '2022',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'STPS',
      pais_origen: 'México',
    },
  },
  // —— CX / servicio (heredado) ——
  {
    match: /tracy/i,
    unifyKey: 'tracy-2005',
    fuente: {
      titulo_obra:
        'The Psychology of Selling: Increase Your Sales Faster and Easier Than You Ever Thought Possible',
      autor_institucion: 'Brian Tracy',
      url_o_referencia: 'https://www.briantracy.com/blog/sales-success/the-psychology-of-selling/',
      ano_publicacion: '2005',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'Thomas Nelson',
      pais_origen: 'Estados Unidos',
    },
  },
  {
    match: /outside\s*in|manning|bodine/i,
    unifyKey: 'outside-in-2012',
    fuente: {
      titulo_obra: 'Outside In: The Power of Putting Customers at the Center of Your Business',
      autor_institucion: 'Harley Manning y Kerry Bodine',
      url_o_referencia: 'https://www.forrester.com/report/Outside-In/',
      ano_publicacion: '2012',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'New Harvest / Houghton Mifflin Harcourt',
      pais_origen: 'Estados Unidos',
    },
  },
  {
    match: /cx\s*trends?|zendesk.*(cx|customer)|customer\s*experience\s*trends/i,
    unifyKey: 'zendesk-cx-trends-2026',
    fuente: {
      titulo_obra: 'Zendesk Customer Experience Trends Report 2026',
      autor_institucion: 'Zendesk',
      url_o_referencia: 'https://www.zendesk.com/blog/customer-experience-trends/',
      ano_publicacion: '2026',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'Zendesk',
      pais_origen: 'Estados Unidos',
    },
  },
  {
    match: /hyken|convenience\s*revolution/i,
    unifyKey: 'hyken-2018',
    fuente: {
      titulo_obra:
        'The Convenience Revolution: How to Deliver a Customer Service Experience that Customers Love',
      autor_institucion: 'Shep Hyken',
      url_o_referencia: 'https://hyken.com/the-convenience-revolution/',
      ano_publicacion: '2018',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'Sound Wisdom',
      pais_origen: 'Estados Unidos',
    },
  },
  {
    match: /toister|customer\s*journey|journey\s*map/i,
    unifyKey: 'toister-journey',
    fuente: {
      titulo_obra: 'Customer Journey Mapping Guide',
      autor_institucion: 'Jeff Toister',
      url_o_referencia: 'https://www.toistersolutions.com/blog/customer-journey-map',
      ano_publicacion: '2023',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'Toister Performance Solutions',
      pais_origen: 'Estados Unidos',
    },
  },
]

/** Paquete mínimo profesional cuando el tema es NOM-035 / acoso-violencia laboral. */
const NOM035_TOPIC_PACK: FuenteRow[] = [
  BIBLIO_CATALOG.find((e) => e.unifyKey === 'nom-035-stps-2018')!.fuente,
  BIBLIO_CATALOG.find((e) => e.unifyKey === 'guia-nom-035-stps')!.fuente,
  BIBLIO_CATALOG.find((e) => e.unifyKey === 'oit-c190')!.fuente,
  BIBLIO_CATALOG.find((e) => e.unifyKey === 'oit-r206')!.fuente,
  BIBLIO_CATALOG.find((e) => e.unifyKey === 'lft-dof')!.fuente,
  BIBLIO_CATALOG.find((e) => e.unifyKey === 'protocolo-inspeccion-stps')!.fuente,
]

function findCatalogMatch(blob: string): BiblioCatalogEntry | null {
  for (const entry of BIBLIO_CATALOG) {
    if (entry.match.test(blob)) return entry
  }
  return null
}

function normalizeFuente(f: Record<string, unknown>): FuenteRow | null {
  const titulo = String(f.titulo_obra || '').trim()
  const url = String(f.url_o_referencia || '').trim()
  if (!titulo && !url) return null
  if (isMarketplaceUrl(url) || isMarketplaceTitle(f) || isPlaceholderFuente(f)) return null

  const blob = `${titulo} ${url} ${f.autor_institucion || ''} ${f.editorial || ''}`
  const catalog = findCatalogMatch(blob)
  if (catalog) return { ...catalog.fuente }

  // Nunca publicar un .docx/.pdf como "título de la obra"
  if (looksLikeFilename(titulo)) {
    const fromName = findCatalogMatch(titulo)
    if (fromName) return { ...fromName.fuente }
    return null
  }

  if (!url || (!isProfessionalUrl(url) && !/^https?:\/\//i.test(url))) {
    // Sin URL usable: solo conservar si parece norma/ley con autor institucional
    if (!/(NOM-|Ley |Convenio |Guía |Protocolo )/i.test(titulo)) return null
  }

  return {
    titulo_obra: titulo || 'Referencia del curso',
    autor_institucion: String(f.autor_institucion || 'No especificado'),
    url_o_referencia: url || 'No especificado',
    ano_publicacion: String(f.ano_publicacion || 'No especificado'),
    ultima_reforma_consultada: String(f.ultima_reforma_consultada || 'No aplica'),
    editorial: String(f.editorial || 'No especificado'),
    pais_origen: String(f.pais_origen || 'México'),
  }
}

function knowledgeToFuente(k: KnowledgeList[number]): FuenteRow | null {
  const name = String(k.name || '').trim()
  if (!name && !k.url && !k.file_path) return null
  if (name && isInternalDesignDoc(name)) return null

  const meta = (k.metadata || {}) as Record<string, unknown>
  const blob = `${name} ${k.url || ''} ${k.file_path || ''} ${meta.author || ''} ${meta.titulo || ''}`
  const catalog = findCatalogMatch(blob)
  if (catalog) return { ...catalog.fuente }

  // Archivo KB sin mapeo bibliográfico: no citar el nombre del archivo
  if (looksLikeFilename(name) || (!k.url && k.file_path)) {
    return null
  }

  const metaUrl = typeof meta.url === 'string' ? meta.url : ''
  const href =
    (k.url && !isMarketplaceUrl(k.url) ? k.url : '') ||
    (metaUrl && !isMarketplaceUrl(metaUrl) ? metaUrl : '') ||
    ''

  if (!href) return null

  const tituloMeta = typeof meta.titulo === 'string' ? meta.titulo : ''
  const titulo = tituloMeta || name
  if (looksLikeFilename(titulo)) {
    const again = findCatalogMatch(`${titulo} ${href}`)
    return again ? { ...again.fuente } : null
  }

  return {
    titulo_obra: titulo || 'Referencia del curso',
    autor_institucion:
      (typeof meta.author === 'string' && meta.author) ||
      (typeof meta.autor === 'string' && meta.autor) ||
      (typeof meta.institucion === 'string' && meta.institucion) ||
      'Autor no especificado',
    url_o_referencia: href,
    ano_publicacion:
      meta.year != null
        ? String(meta.year)
        : meta.ano != null
          ? String(meta.ano)
          : 'No especificado',
    ultima_reforma_consultada:
      typeof meta.reforma === 'string' ? meta.reforma : 'No aplica',
    editorial:
      (typeof meta.editorial === 'string' && meta.editorial) ||
      (typeof meta.institucion === 'string' && meta.institucion) ||
      'No especificado',
    pais_origen: (typeof meta.pais === 'string' && meta.pais) || 'México',
  }
}

function topicDefaultPack(
  knowledge: KnowledgeList,
  existing: Array<Record<string, unknown>>,
  courseHint?: { name?: string; norm_reference?: string | null }
): FuenteRow[] {
  const blob = [
    courseHint?.name || '',
    courseHint?.norm_reference || '',
    ...knowledge.map((k) => `${k.name} ${k.url || ''}`),
    ...existing.map((f) => `${f.titulo_obra || ''} ${f.url_o_referencia || ''}`),
  ].join(' ')

  if (/nom[\s_-]*035|nom035|violencia\s*laboral|acoso\s*(laboral|sexual)|riesgo\s*psicosocial/i.test(blob)) {
    return NOM035_TOPIC_PACK.map((f) => ({ ...f }))
  }
  if (/servicio\s*al\s*cliente|excelencia\s*en\s*el\s*servicio|customer\s*experience|\bcx\b|atenci[oó]n\s*al\s*cliente/i.test(blob)) {
    return [
      BIBLIO_CATALOG.find((e) => e.unifyKey === 'zendesk-cx-trends-2026')!.fuente,
      BIBLIO_CATALOG.find((e) => e.unifyKey === 'hyken-2018')!.fuente,
      BIBLIO_CATALOG.find((e) => e.unifyKey === 'tracy-2005')!.fuente,
      BIBLIO_CATALOG.find((e) => e.unifyKey === 'outside-in-2012')!.fuente,
      BIBLIO_CATALOG.find((e) => e.unifyKey === 'toister-journey')!.fuente,
    ].map((f) => ({ ...f }))
  }
  if (/nom[\s_-]*029|instalaciones?\s*el[eé]ctricas|seguridad\s*el[eé]ctrica/i.test(blob)) {
    return [
      {
        titulo_obra:
          'NOM-029-STPS-2011, Mantenimiento de las instalaciones eléctricas en los centros de trabajo — Condiciones de seguridad',
        autor_institucion: 'Secretaría del Trabajo y Previsión Social (STPS)',
        url_o_referencia:
          'https://www.gob.mx/stps/documentos/norma-oficial-mexicana-nom-029-stps-2011-mantenimiento-de-las-instalaciones-electricas-en-los-centros-de-trabajo-condiciones-de-seguridad',
        ano_publicacion: '2011',
        ultima_reforma_consultada: 'No aplica',
        editorial: 'Diario Oficial de la Federación (DOF)',
        pais_origen: 'México',
      },
      {
        titulo_obra: 'Normas oficiales mexicanas en materia de seguridad y salud en el trabajo',
        autor_institucion: 'Secretaría del Trabajo y Previsión Social (STPS)',
        url_o_referencia: 'https://www.stps.gob.mx/bp/secciones/dgsst/normatividad/normas.html',
        ano_publicacion: '2024',
        ultima_reforma_consultada: 'No aplica',
        editorial: 'STPS',
        pais_origen: 'México',
      },
      BIBLIO_CATALOG.find((e) => e.unifyKey === 'lft-dof')!.fuente,
    ].map((f) => ({ ...f }))
  }
  // Paquete genérico oficial para no dejar vacía la sección Fuentes
  return [
    {
      titulo_obra: 'Diario Oficial de la Federación',
      autor_institucion: 'Secretaría de Gobernación',
      url_o_referencia: 'https://www.dof.gob.mx/',
      ano_publicacion: '2024',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'DOF',
      pais_origen: 'México',
    },
    {
      titulo_obra: 'Portal de la Secretaría del Trabajo y Previsión Social',
      autor_institucion: 'STPS',
      url_o_referencia: 'https://www.gob.mx/stps',
      ano_publicacion: '2024',
      ultima_reforma_consultada: 'No aplica',
      editorial: 'STPS',
      pais_origen: 'México',
    },
    BIBLIO_CATALOG.find((e) => e.unifyKey === 'lft-dof')!.fuente,
  ].map((f) => ({ ...f }))
}

function dedupeFuentes(rows: FuenteRow[]): FuenteRow[] {
  const out: FuenteRow[] = []
  const seenUrl = new Set<string>()
  const seenTitle = new Set<string>()
  const seenUnify = new Set<string>()

  for (const row of rows) {
    const catalog = findCatalogMatch(`${row.titulo_obra} ${row.url_o_referencia}`)
    if (catalog?.unifyKey) {
      if (seenUnify.has(catalog.unifyKey)) continue
      seenUnify.add(catalog.unifyKey)
    }
    const u = row.url_o_referencia.toLowerCase()
    const t = row.titulo_obra.toLowerCase()
    if (u && seenUrl.has(u)) continue
    if (t && seenTitle.has(t)) continue
    if (u) seenUrl.add(u)
    if (t) seenTitle.add(t)
    out.push(row)
  }
  return out
}

/**
 * Une KB + fuentes generadas por IA + paquete temático oficial.
 * Prioriza citas profesionales; nunca deja un .docx como única fuente.
 */
export function mergeKnowledgeIntoFuentes(
  payload: unknown,
  knowledge: KnowledgeList,
  courseHint?: { name?: string; norm_reference?: string | null }
): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const data = payload as Record<string, unknown>
  const existing = Array.isArray(data.fuentes_informacion)
    ? (data.fuentes_informacion as Array<Record<string, unknown>>)
    : []

  const fromKnowledge: FuenteRow[] = []
  const seenUnify = new Set<string>()

  for (const k of knowledge) {
    if (isMarketplaceUrl(k.url)) continue
    const blob = `${k.name || ''} ${k.url || ''} ${k.file_path || ''}`
    const catalog = findCatalogMatch(blob)
    if (catalog?.unifyKey) {
      if (seenUnify.has(catalog.unifyKey)) continue
      seenUnify.add(catalog.unifyKey)
    }
    const row = knowledgeToFuente(k)
    if (!row) continue
    if (isMarketplaceUrl(row.url_o_referencia) || isMarketplaceTitle(row)) continue
    fromKnowledge.push(row)
  }

  const fromAi = existing
    .map((f) => normalizeFuente(f))
    .filter((f): f is FuenteRow => !!f)

  const topicPack = topicDefaultPack(knowledge, existing, courseHint)

  // Orden: citas oficiales del tema → KB enriquecida → investigación IA
  const merged = dedupeFuentes([...topicPack, ...fromKnowledge, ...fromAi]).slice(0, 10)

  data.fuentes_informacion =
    merged.length >= 5
      ? merged.slice(0, 8)
      : dedupeFuentes([...merged, ...topicPack]).slice(0, 8)

  if (!Array.isArray(data.fuentes_informacion) || data.fuentes_informacion.length === 0) {
    data.fuentes_informacion = topicDefaultPack(knowledge, existing, courseHint).slice(0, 5)
  }

  // Recursos de continuidad: garantizar al menos 3 entradas con URL o texto útil
  const continuity = Array.isArray(data.recursos_continuidad)
    ? (data.recursos_continuidad as unknown[]).map((x) => String(x || '').trim()).filter(Boolean)
    : []
  if (continuity.length < 3) {
    const fallbacks = (data.fuentes_informacion as FuenteRow[])
      .map((f) => f.url_o_referencia)
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 5)
    data.recursos_continuidad = Array.from(new Set([...continuity, ...fallbacks])).slice(0, 5)
  }

  return data
}
