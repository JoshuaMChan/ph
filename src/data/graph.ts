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
  { from: 'greece', to: 'stoicism', color: 'var(--c-greece)' },
  { from: 'stoicism', to: 'scholasticism', color: 'var(--c-stoicism)' },
  { from: 'scholasticism', to: 'rationalism', color: 'var(--c-scholastic)' },
  { from: 'scholasticism', to: 'empiricism', color: 'var(--c-scholastic)' },
  { from: 'rationalism', to: 'classical', color: 'var(--c-reason)' },
  { from: 'empiricism', to: 'classical', color: 'var(--c-experience)' },
  { from: 'classical', to: 'life', color: 'var(--c-classical)' },
  { from: 'classical', to: 'analytic', color: 'var(--c-classical)' },
  { from: 'nietzsche', to: 'deconstruction', viaCluster: 'life', color: 'var(--c-life)' },
  { from: 'nietzsche', to: 'existentialism', viaCluster: 'life', color: 'var(--c-life)' },
  { from: 'kierkegaard', to: 'existentialism', viaCluster: 'life', color: 'var(--c-life)' },
  { from: 'phenomenology', to: 'existentialism', color: 'var(--c-phenom)' },
  {
    from: 'greece',
    to: 'political',
    color: 'var(--c-political)',
    fromSide: 'bottom',
    toSide: 'top',
  },
  { from: 'machiavelli', to: 'hobbes', color: 'var(--c-political)', fromSide: 'right', toSide: 'left' },
  { from: 'hobbes', to: 'rousseau', color: 'var(--c-political)', fromSide: 'right', toSide: 'left' },
  { from: 'rousseau', to: 'marx', color: 'var(--c-political)', fromSide: 'right', toSide: 'left' },
]
