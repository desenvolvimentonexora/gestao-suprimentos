import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button, Modal } from '../../../components'
import { formatDate } from '../../../lib/formatters'
import type { ReviewRow } from './types'

export interface ReviewsPopupProps {
  isOpen: boolean
  onClose: () => void
  reviews: ReviewRow[]
  onSubmitReview: (rating: number, comment: string) => void
  isSubmitting: boolean
}

function StarPicker({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
          onClick={() => onChange(value)}
          className="text-accent"
        >
          <Star size={20} fill={value <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export function ReviewsPopup({
  isOpen,
  onClose,
  reviews,
  onSubmitReview,
  isSubmitting,
}: ReviewsPopupProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  function handleSubmit() {
    if (rating === 0) return
    onSubmitReview(rating, comment)
    setRating(0)
    setComment('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Avaliações">
      <div className="flex flex-col gap-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhuma avaliação ainda.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-line pb-2">
              <div className="flex text-accent">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    size={14}
                    fill={value <= review.rating ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                ))}
              </div>
              {review.comment && <p className="text-sm text-ink">{review.comment}</p>}
              <p className="text-xs text-ink-muted">
                {review.authorName} · {formatDate(new Date(review.createdAt))}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <StarPicker rating={rating} onChange={setRating} />
        <label htmlFor="review-comment" className="text-sm font-medium text-ink">
          Comentário
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
          Enviar avaliação
        </Button>
      </div>
    </Modal>
  )
}
