import { describe, expect, it } from 'vitest'
import { extractSubdomain } from './extractSubdomain'

describe('extractSubdomain', () => {
  it('retorna o subdomínio para um host de produção', () => {
    expect(extractSubdomain('construtora-abc.nexora.com')).toBe('construtora-abc')
  })

  it('retorna null para o domínio raiz, sem subdomínio', () => {
    expect(extractSubdomain('nexora.com')).toBeNull()
  })

  it('retorna null quando o subdomínio é "www"', () => {
    expect(extractSubdomain('www.nexora.com')).toBeNull()
  })

  it('retorna null para localhost', () => {
    expect(extractSubdomain('localhost')).toBeNull()
  })

  it('retorna null para um endereço IP', () => {
    expect(extractSubdomain('127.0.0.1')).toBeNull()
  })
})
