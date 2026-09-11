import { PendingReleaseList } from './PendingReleaseList'
import { useReleaseComparison, useSetFinancialChargeRequested, usePendingReleases } from './queries'

export function PendingReleaseSection() {
  const pendingReleasesQuery = usePendingReleases(true)
  const releaseComparison = useReleaseComparison()
  const setFinancialChargeRequested = useSetFinancialChargeRequested()

  return (
    <PendingReleaseList
      rows={pendingReleasesQuery.data ?? []}
      onRelease={(comparisonId, paymentConditionNote) => {
        releaseComparison.mutate({ comparisonId, decision: 'released', paymentConditionNote })
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
