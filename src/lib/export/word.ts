import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  ShadingType,
} from 'docx'
import type { ContentBlock, Modulo, Curso } from '@/types/curso'

function blockToParagraphs(block: ContentBlock): (Paragraph | Table)[] {
  switch (block.type) {
    case 'text': {
      const html = (block.content.html as string) ?? ''
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      return [new Paragraph({ text, spacing: { after: 200 } })]
    }
    case 'table': {
      const headers = (block.content.headers as string[]) ?? []
      const rows = (block.content.rows as string[][]) ?? []

      const headerRow = new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })] })],
              shading: { type: ShadingType.SOLID, color: '1E3C72' },
            })
        ),
      })

      const dataRows = rows.map(
        (row, i) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ text: cell })],
                  shading: i % 2 !== 0 ? { type: ShadingType.SOLID, color: 'F8FAFC' } : undefined,
                })
            ),
          })
      )

      return [
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        new Paragraph({ text: '', spacing: { after: 200 } }),
      ]
    }
    case 'highlight': {
      const title = block.content.title as string | undefined
      const body = block.content.body as string ?? ''
      const children: TextRun[] = []
      if (title) children.push(new TextRun({ text: title + ': ', bold: true }))
      children.push(new TextRun({ text: body }))
      return [new Paragraph({ children, spacing: { after: 200 } })]
    }
    default:
      return []
  }
}

export async function buildModuleWord(curso: Curso, modulo: Modulo, blocks: ContentBlock[]): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: `${curso.name} — Módulo ${modulo.number}`,
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({
      text: modulo.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
  ]

  if (modulo.objectives.length > 0) {
    children.push(new Paragraph({ text: 'Objetivos de aprendizaje', heading: HeadingLevel.HEADING_2 }))
    modulo.objectives.forEach((o) => {
      children.push(new Paragraph({ text: `• ${o}`, spacing: { after: 100 } }))
    })
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
  }

  blocks.forEach((b) => {
    blockToParagraphs(b).forEach((p) => children.push(p))
  })

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `iCurs@ Consultoría y Formación de Talento — ${new Date().toLocaleDateString('es-MX')}`,
          color: '6B7280',
          size: 18,
        }),
      ],
      spacing: { before: 800 },
    })
  )

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}
