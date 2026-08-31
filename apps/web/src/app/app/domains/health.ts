export function healthTone(score: number): 'neutral' | 'green' | 'amber' | 'red' {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  if (score > 0) return 'red';
  return 'neutral';
}
