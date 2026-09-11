const PAGESPEED_REASON_LABELS: Record<string, string> = {
  timeout: 'délai dépassé',
  rate_limited: 'quota Google temporairement atteint',
  invalid_json: 'réponse Google illisible',
  invalid_response_shape: 'réponse Google inattendue',
  network_error: 'erreur réseau',
}

export function pageSpeedReasonLabel(reason: string): string {
  if (PAGESPEED_REASON_LABELS[reason]) return PAGESPEED_REASON_LABELS[reason]
  if (reason.startsWith('server_error_')) return 'erreur serveur Google'
  if (reason.startsWith('http_error_')) return 'erreur Google'
  return reason
}

export function formatMeasuredAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
