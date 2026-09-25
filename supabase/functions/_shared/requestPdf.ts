import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'https://esm.sh/pdf-lib@1.17.1'

// Gera o PDF da Solicitação quando ela não tem um PDF original (nasceu de
// importação por planilha, não de upload/API) — usado no momento do Disparo
// (review-request/attemptAutoDispatch). Não busca ser idêntico ao layout do
// ERP do cliente (isso violaria a regra 4.1 do CLAUDE.md, de não fixar nada
// específico de cliente no código) — só precisa trazer as mesmas
// informações, de forma legível, a partir dos dados que já temos salvos.

export interface RequestPdfItem {
  materialCode: string | null
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface RequestPdfData {
  requestNumber: string
  unitName: string
  requesterName: string | null
  createdAt: string
  neededBy: string | null
  notes: string | null
  items: RequestPdfItem[]
}

const PAGE_SIZE: [number, number] = [595.28, 841.89] // A4
const MARGIN = 50
const LINE_HEIGHT = 16

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

export async function generateRequestPdf(data: RequestPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage(PAGE_SIZE)
  let y = PAGE_SIZE[1] - MARGIN

  function newPageIfNeeded(minSpaceLeft: number) {
    if (y - minSpaceLeft < MARGIN) {
      page = doc.addPage(PAGE_SIZE)
      y = PAGE_SIZE[1] - MARGIN
    }
  }

  function drawLine(text: string, options: { font?: PDFFont; size?: number } = {}) {
    page.drawText(text, {
      x: MARGIN,
      y,
      font: options.font ?? font,
      size: options.size ?? 10,
      color: rgb(0.08, 0.08, 0.08),
    })
    y -= LINE_HEIGHT
  }

  drawLine(`Solicitação Nº ${data.requestNumber}`, { font: bold, size: 14 })
  y -= 4
  drawLine(`Obra: ${data.unitName}`)
  if (data.requesterName) drawLine(`Solicitante: ${data.requesterName}`)
  drawLine(`Data da solicitação: ${formatDate(data.createdAt)}`)
  if (data.neededBy) drawLine(`Entrega desejada: ${formatDate(data.neededBy)}`)
  y -= 8

  drawLine('Itens', { font: bold, size: 11 })
  y -= 2

  const columns = { code: MARGIN, name: MARGIN + 90, qty: MARGIN + 330, unit: MARGIN + 400 }
  function drawRow(page_: PDFPage, cells: { code: string; name: string; qty: string; unit: string }, useFont: PDFFont) {
    page_.drawText(cells.code, { x: columns.code, y, font: useFont, size: 9, color: rgb(0.08, 0.08, 0.08) })
    page_.drawText(cells.name, { x: columns.name, y, font: useFont, size: 9, color: rgb(0.08, 0.08, 0.08) })
    page_.drawText(cells.qty, { x: columns.qty, y, font: useFont, size: 9, color: rgb(0.08, 0.08, 0.08) })
    page_.drawText(cells.unit, { x: columns.unit, y, font: useFont, size: 9, color: rgb(0.08, 0.08, 0.08) })
  }

  drawRow(page, { code: 'Código', name: 'Descrição', qty: 'Quantidade', unit: 'Un.' }, bold)
  y -= LINE_HEIGHT

  for (const item of data.items) {
    newPageIfNeeded(LINE_HEIGHT)
    drawRow(
      page,
      {
        code: item.materialCode ?? '—',
        name: item.materialName.length > 45 ? `${item.materialName.slice(0, 42)}...` : item.materialName,
        qty: String(item.quantity),
        unit: item.unitOfMeasure ?? '—',
      },
      font,
    )
    y -= LINE_HEIGHT
  }

  if (data.notes) {
    y -= 8
    newPageIfNeeded(LINE_HEIGHT * 2)
    drawLine('Observação', { font: bold, size: 11 })
    drawLine(data.notes)
  }

  return doc.save()
}
