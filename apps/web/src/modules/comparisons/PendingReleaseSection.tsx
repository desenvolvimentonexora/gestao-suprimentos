import { PendingReleaseList } from './PendingReleaseList'
import {
  useConfirmPaymentProof,
  usePendingReleases,
  useReleaseComparison,
  useSetFinancialChargeRequested,
} from './queries'

export function PendingReleaseSection() {
  const pendingReleasesQuery = usePendingReleases(true)
  const releaseComparison = useReleaseComparison()
  const setFinancialChargeRequested = useSetFinancialChargeRequested()
  const confirmPaymentProof = useConfirmPaymentProof()

  return (
    <PendingReleaseList
      rows={pendingReleasesQuery.data ?? []}
      onConfirmPaymentProof={(comparisonId) => confirmPaymentProof.mutate(comparisonId)}
      onRelease={(comparisonId) => {
        releaseComparison.mutate({ comparisonId, decision: 'released' })
      }}
      onReject={(comparisonId, reason) => {
        releaseComparison.mutate({ comparisonId, decision: 'rejected', rejectionReason: reason })
      }}
      onRequestFinancialCharge={(comparisonId) =>
        setFinancialChargeRequested.mutate({ comparisonId, value: true })
      }
      isSubmitting={releaseComparison.isPending}
    />
  )
}
