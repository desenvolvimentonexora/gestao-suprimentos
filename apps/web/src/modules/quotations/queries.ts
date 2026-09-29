import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  discardQuotation,
  fetchNegotiatingAttachments,
  fetchNegotiatingAttachmentUrl,
  fetchNegotiatingRequests,
  fetchNegotiatorOptions,
  fetchQuotationAttachmentUrl,
  sendBackToDispatch,
  updateNegotiationNotes,
  updateNegotiator,
} from './api'

export function useNegotiatingRequests() {
  return useQuery({ queryKey: ['negotiating-requests'], queryFn: fetchNegotiatingRequests })
}

export function useNegotiatorOptions() {
  return useQuery({ queryKey: ['negotiator-options'], queryFn: fetchNegotiatorOptions })
}

export function useDiscardQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quotationId: string) => discardQuotation(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useUpdateNegotiator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, negotiatorId }: { requestId: string; negotiatorId: string | null }) =>
      updateNegotiator(requestId, negotiatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useUpdateNegotiationNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes: string }) =>
      updateNegotiationNotes(requestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useSendBackToDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => sendBackToDispatch(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useViewQuotationPdf() {
  return useMutation({
    mutationFn: (quotationId: string) => fetchQuotationAttachmentUrl(quotationId),
    onSuccess: (url) => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.alert('Nenhum PDF encontrado para esta cotação.')
      }
    },
    onError: (error) => {
      window.alert(error instanceof Error ? error.message : 'Não foi possível abrir o PDF. Tente novamente.')
    },
  })
}

export function useNegotiatingAttachments(requestId: string | null) {
  return useQuery({
    queryKey: ['negotiating-attachments', requestId],
    queryFn: () => fetchNegotiatingAttachments(requestId!),
    enabled: Boolean(requestId),
  })
}

export function useViewNegotiatingAttachment() {
  return useMutation({
    mutationFn: (attachment: { id: string; kind: 'sol' | 'quotation' }) => fetchNegotiatingAttachmentUrl(attachment),
    onSuccess: (url) => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.alert('Arquivo não encontrado.')
      }
    },
    onError: (error) => {
      window.alert(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo. Tente novamente.')
    },
  })
}
