/** Color por nivel de riesgo (marcadores). */
export function riskDotColor(level?: string): string {
  const l = level?.toLowerCase?.() ?? ''
  if (l === 'alto') return '#dc2626'
  if (l === 'medio') return '#ea580c'
  if (l === 'bajo') return '#16a34a'
  return '#64748b'
}
