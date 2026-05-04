import type { ContentBlock, Modulo, Curso } from '@/types/curso'

function blockToHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'text': {
      const html = (block.content.html as string) ?? ''
      return `<div class="block-text">${html}</div>`
    }
    case 'table': {
      const headers = (block.content.headers as string[]) ?? []
      const rows = (block.content.rows as string[][]) ?? []
      const caption = block.content.caption as string | undefined
      return `
        ${caption ? `<p class="caption">${caption}</p>` : ''}
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((r, i) => `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`
    }
    case 'highlight': {
      const title = block.content.title as string | undefined
      const body = block.content.body as string ?? ''
      return `<div class="highlight">${title ? `<strong>${title}</strong>` : ''}<p>${body}</p></div>`
    }
    default:
      return `<div class="block-default"><pre>${JSON.stringify(block.content, null, 2)}</pre></div>`
  }
}

export function buildModuleHtml(curso: Curso, modulo: Modulo, blocks: ContentBlock[]): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; font-size: 11pt; color: #1A1A2E; background: white; padding: 2cm; }
  h1 { font-family: 'Montserrat', sans-serif; font-size: 18pt; color: #1E3C72; margin-bottom: 0.5cm; }
  h2 { font-family: 'Montserrat', sans-serif; font-size: 14pt; color: #1E3C72; margin: 0.5cm 0 0.3cm; }
  h3 { font-family: 'Montserrat', sans-serif; font-size: 12pt; color: #6C3FC5; margin: 0.4cm 0 0.2cm; }
  p { margin-bottom: 0.3cm; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 0.4cm 0; }
  th { background: #1E3C72; color: white; padding: 8px 12px; text-align: left; font-size: 10pt; }
  td { padding: 7px 12px; border-bottom: 1px solid #E2E8F0; }
  tr.even { background: white; }
  tr.odd { background: #F8FAFC; }
  .highlight { border-left: 4px solid #6C3FC5; background: rgba(108,63,197,0.05); padding: 12px 16px; margin: 0.4cm 0; border-radius: 0 8px 8px 0; }
  .caption { font-size: 9pt; color: #6B7280; margin-bottom: 4px; }
  .header { background: linear-gradient(135deg, #1E3C72, #6C3FC5); color: white; padding: 1cm; margin: -2cm -2cm 1cm -2cm; }
  .module-tag { font-size: 9pt; opacity: 0.75; }
  pre { background: #F1F5F9; padding: 12px; border-radius: 6px; font-size: 9pt; overflow: auto; }
  ul, ol { margin: 0.2cm 0 0.3cm 1cm; }
  li { margin-bottom: 0.15cm; }
</style>
</head>
<body>
  <div class="header">
    <p class="module-tag">MÓDULO ${modulo.number} — ${curso.name}</p>
    <h1 style="color:white; margin-top:4px;">${modulo.title}</h1>
  </div>

  ${modulo.objectives.length > 0 ? `
  <h2>Objetivos de aprendizaje</h2>
  <ul>
    ${modulo.objectives.map((o) => `<li>${o}</li>`).join('')}
  </ul>` : ''}

  ${blocks.map(blockToHtml).join('\n')}

  <div style="margin-top:2cm; padding-top:0.5cm; border-top:1px solid #E2E8F0; font-size:9pt; color:#6B7280; text-align:center;">
    iCurs@ Consultoría y Formación de Talento — Generado ${new Date().toLocaleDateString('es-MX')}
  </div>
</body>
</html>`
}

export async function renderPDF(html: string): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    printBackground: true,
  })
  await browser.close()
  return Buffer.from(pdf)
}
