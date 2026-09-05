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
  { from: 'presocratic', to: 'greece', color: 'var(--c-presocratic)' },
  { from: 'greece', to: 'stoicism', color: 'var(--c-greece)' },
  { from: 'greece', to: 'epicureanism', color: 'var(--c-greece)' },
  { from: 'greece', to: 'skepticism', color: 'var(--c-greece)' },
  { from: 'stoicism', to: 'scholasticism', color: 'var(--c-stoicism)' },
  { from: 'epicureanism', to: 'scholasticism', color: 'var(--c-epicurean)' },
  { from: 'skepticism', to: 'scholasticism', color: 'var(--c-skepticism)' },
  { from: 'scholasticism', to: 'rationalism', color: 'var(--c-scholastic)' },
  { from: 'scholasticism', to: 'empiricism', color: 'var(--c-scholastic)' },
  { from: 'rationalism', to: 'classical', color: 'var(--c-reason)' },
  { from: 'empiricism', to: 'classical', color: 'var(--c-experience)' },
  { from: 'classical', to: 'life', color: 'var(--c-classical)' },
  { from: 'classical', to: 'phenomenology', color: 'var(--c-classical)' },
  { from: 'classical', to: 'analytic', color: 'var(--c-classical)' },
  { from: 'life', to: 'existentialism', color: 'var(--c-life)' },
  { from: 'life', to: 'deconstruction', color: 'var(--c-life)' },
  { from: 'phenomenology', to: 'existentialism', color: 'var(--c-phenom)' },
  {
    from: 'greece',
    to: 'political',
    color: 'var(--c-political)',
    fromSide: 'bottom',
    toSide: 'left',
  },
  // Philosophy expanded: fork from medieval philosophy up into the science summary bar
  {
    from: 'scholasticism',
    to: 'science-bar',
    color: 'var(--c-astronomy)',
    fromSide: 'top',
    toSide: 'left',
  },
  // Science expanded: philosophy summary sits below; arrow into astronomy's left edge
  {
    from: 'philosophy-bar',
    to: 'astronomy',
    color: 'var(--c-astronomy)',
    fromSide: 'top',
    toSide: 'left',
  },
  // Natural science lineage
  {
    from: 'galileo',
    to: 'classicalMechanics',
    color: 'var(--c-classical-mech)',
    fromSide: 'bottom',
    toSide: 'left',
  },
  {
    from: 'classicalMechanics',
    to: 'electrodynamics',
    color: 'var(--c-electro)',
  },
  {
    from: 'classicalMechanics',
    to: 'statisticalPhysics',
    color: 'var(--c-statphys)',
    fromSide: 'bottom',
    toSide: 'left',
  },
  {
    from: 'electrodynamics',
    to: 'relativity',
    color: 'var(--c-relativity)',
  },
  {
    from: 'statisticalPhysics',
    to: 'quantumMechanics',
    color: 'var(--c-quantum)',
  },
  {
    from: 'quantumMechanics',
    to: 'quantumFieldTheory',
    color: 'var(--c-qft)',
  },
]
