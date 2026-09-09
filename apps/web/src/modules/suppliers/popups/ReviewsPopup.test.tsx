import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewsPopup } from './ReviewsPopup'
import type { ReviewRow } from './types'

const reviews: ReviewRow[] = [
  {
    id: 'r1',
    rating: 4,
    comment: 'Bom atendimento',
    authorName: 'Marcelo Souza',
    createdAt: '2026-09-01T10:00:00Z',
  },
]

describe('ReviewsPopup', () => {
  it('lista as avaliações existentes', () => {
    render(
      <ReviewsPopup
        isOpen
        onClose={vi.fn()}
        reviews={reviews}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />,
    )
    expect(screen.getByText('Bom atendimento')).toBeInTheDocument()
    expect(screen.getByText(/Marcelo Souza/)).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há avaliações', () => {
    render(
      <ReviewsPopup
        isOpen
        onClose={vi.fn()}
        reviews={[]}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />,
    )
    expect(screen.getByText(/nenhuma avaliação/i)).toBeInTheDocument()
  })

  it('envia a nova avaliação com nota e comentário', async () => {
    const onSubmitReview = vi.fn()
    render(
      <ReviewsPopup
        isOpen
        onClose={vi.fn()}
        reviews={[]}
        onSubmitReview={onSubmitReview}
        isSubmitting={false}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: '3 estrelas' }))
    await userEvent.type(screen.getByLabelText('Comentário'), 'Entrega no prazo')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }))

    expect(onSubmitReview).toHaveBeenCalledWith(3, 'Entrega no prazo')
  })
})
