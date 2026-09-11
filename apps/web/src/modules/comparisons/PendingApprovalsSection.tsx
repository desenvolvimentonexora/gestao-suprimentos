import { PendingApprovalsList } from './PendingApprovalsList'
import { useDecideComparison, usePendingApprovals } from './queries'

export function PendingApprovalsSection() {
  const pendingApprovalsQuery = usePendingApprovals(true)
  const decideComparison = useDecideComparison()

  return (
    <PendingApprovalsList
      rows={pendingApprovalsQuery.data ?? []}
      onApprove={(comparisonId) => {
        decideComparison.mutate({ comparisonId, decision: 'approved' })
      }}
      onReject={(comparisonId, reason) => {
        decideComparison.mutate({ comparisonId, decision: 'rejected', rejectionReason: reason })
      }}
      isSubmitting={decideComparison.isPending}
    />
  )
}
