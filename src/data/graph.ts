export type GraphEdge = {
  from: string
  to: string
  dashed?: boolean
  color: string
  viaCluster?: string
  fromSide?: 'left' | 'right' | 'top' | 'bottom'
  toSide?: 'left' | 'right' | 'top' | 'bottom'
}

export const graphEdges: GraphEdge[] = [
  { from: 'greece', to: 'scholasticism', dashed: true, color: 'var(--c-greece)' },
  { from: 'scholasticism', to: 'rationalism', color: 'var(--c-scholastic)' },
  { from: 'scholasticism', to: 'empiricism', color: 'var(--c-scholastic)' },
  { from: 'rationalism', to: 'classical', color: 'var(--c-reason)' },
  { from: 'empiricism', to: 'classical', color: 'var(--c-experience)' },
  { from: 'classical', to: 'life', color: 'var(--c-classical)' },
  { from: 'classical', to: 'analytic', color: 'var(--c-classical)' },
  { from: 'nietzsche', to: 'structuralism', viaCluster: 'life', color: 'var(--c-life)' },
  { from: 'nietzsche', to: 'existentialism', viaCluster: 'life', color: 'var(--c-life)' },
  { from: 'kierkegaard', to: 'existentialism', viaCluster: 'life', color: 'var(--c-life)' },
  { from: 'phenomenology', to: 'existentialism', color: 'var(--c-phenom)' },
  {
    from: 'greece',
    to: 'machiavelli',
    dashed: true,
    color: 'var(--c-political)',
    fromSide: 'bottom',
    toSide: 'top',
  },
]
