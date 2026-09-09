import { describe, expect, it } from 'vitest'
import { guessMaterialIcon } from './guessMaterialIcon'

describe('guessMaterialIcon', () => {
  it('reconhece cabos e elétrica', () => {
    expect(guessMaterialIcon('Cabo Flexível')).toBe('zap')
    expect(guessMaterialIcon('Barramento Blindado')).toBe('zap')
  })

  it('reconhece EPI, sem diferenciar acentuação', () => {
    expect(guessMaterialIcon('Proteção EPI')).toBe('shield')
    expect(guessMaterialIcon('Luva de Raspa')).toBe('shield')
  })

  it('reconhece ferramentas', () => {
    expect(guessMaterialIcon('Furadeira de Impacto')).toBe('wrench')
    expect(guessMaterialIcon('Parafusadeira')).toBe('wrench')
  })

  it('reconhece móveis', () => {
    expect(guessMaterialIcon('Cadeiras Metálicas')).toBe('armchair')
  })

  it('reconhece churrasqueira', () => {
    expect(guessMaterialIcon('Churrasqueira')).toBe('flame')
  })

  it('reconhece tintas e pintura', () => {
    expect(guessMaterialIcon('Tinta Acrílica')).toBe('paintbrush')
  })

  it('reconhece vidros e portas', () => {
    expect(guessMaterialIcon('Porta Pronta')).toBe('door-open')
  })

  it('reconhece concreto e cimento', () => {
    expect(guessMaterialIcon('Cimento CP-II')).toBe('layers')
  })

  it('reconhece hidráulica', () => {
    expect(guessMaterialIcon('Tubo Pex - Gás')).toBe('droplet')
  })

  it('usa o ícone padrão quando não reconhece nada', () => {
    expect(guessMaterialIcon('Aluguel de Conteiner')).toBe('package')
  })

  it('respeita a ordem de prioridade (primeira correspondência vence)', () => {
    expect(guessMaterialIcon('Cabo com Ferramenta de Corte')).toBe('zap')
  })

  it('não diferencia maiúsculas de minúsculas', () => {
    expect(guessMaterialIcon('CABO ELÉTRICO')).toBe('zap')
  })
})
