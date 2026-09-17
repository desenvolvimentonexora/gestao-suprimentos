import { describe, expect, it } from 'vitest'
import { buildMailtoUrl } from './buildMailtoUrl'

describe('buildMailtoUrl', () => {
  it('monta a URL mailto com assunto e corpo codificados', () => {
    const url = buildMailtoUrl({ subject: 'Assunto & teste', body: 'Linha 1\nLinha 2' })
    expect(url.startsWith('mailto:?')).toBe(true)
    expect(url).toContain('subject=Assunto+%26+teste')
    expect(url).toContain('body=Linha+1%0ALinha+2')
  })

  it('inclui o destinatário quando informado', () => {
    const url = buildMailtoUrl({ to: 'engenheiro@example.com', subject: 'Oi', body: 'Corpo' })
    expect(url.startsWith('mailto:engenheiro@example.com?')).toBe(true)
  })
})
