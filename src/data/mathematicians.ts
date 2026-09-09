import type { DateMark } from '../types'

export type MathDomainId =
  | 'algebra'
  | 'analysis'
  | 'geometry'
  | 'numberTheory'

export type Mathematician = {
  id: string
  nativeName: string
  country: string
  portrait: string
  birth: DateMark
  death?: DateMark
  domains: MathDomainId[]
}

/** Four parallel axes — top→bottom: geometry, number theory, algebra, analysis. */
export const mathDomainOrder: MathDomainId[] = [
  'geometry',
  'numberTheory',
  'algebra',
  'analysis',
]

export const mathDomainAccent: Record<MathDomainId, string> = {
  algebra: 'var(--c-algebra)',
  analysis: 'var(--c-analysis)',
  geometry: 'var(--c-geometry)',
  numberTheory: 'var(--c-number-theory)',
}

/** Chronological; domains mark which axes each person advanced. */
export const mathematicians: Mathematician[] = [
  {
    id: 'euclid',
    nativeName: 'Euclid',
    country: 'greece',
    portrait: '/portraits/euclid.jpg',
    birth: { year: -325, circa: true },
    death: { year: -265, circa: true },
    domains: ['geometry', 'numberTheory'],
  },
  {
    id: 'archimedes',
    nativeName: 'Archimedes',
    country: 'greece',
    portrait: '/portraits/archimedes.jpg',
    birth: { year: -287 },
    death: { year: -212 },
    domains: ['analysis', 'geometry'],
  },
  {
    id: 'descartes',
    nativeName: 'René Descartes',
    country: 'france',
    portrait: '/portraits/descartes.jpg',
    birth: { year: 1596, month: 3, day: 31 },
    death: { year: 1650, month: 2, day: 11 },
    domains: ['algebra', 'geometry'],
  },
  {
    id: 'fermat',
    nativeName: 'Pierre de Fermat',
    country: 'france',
    portrait: '/portraits/fermat.jpg',
    birth: { year: 1607 },
    death: { year: 1665, month: 1, day: 12 },
    domains: ['analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'newton',
    nativeName: 'Isaac Newton',
    country: 'britain',
    portrait: '/portraits/newton.jpg',
    birth: { year: 1643, month: 1, day: 4 },
    death: { year: 1727, month: 3, day: 31 },
    domains: ['analysis', 'geometry'],
  },
  {
    id: 'leibniz',
    nativeName: 'Gottfried Wilhelm Leibniz',
    country: 'germany',
    portrait: '/portraits/leibniz.jpg',
    birth: { year: 1646, month: 7, day: 1 },
    death: { year: 1716, month: 11, day: 14 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'euler',
    nativeName: 'Leonhard Euler',
    country: 'switzerland',
    portrait: '/portraits/euler.jpg',
    birth: { year: 1707, month: 4, day: 15 },
    death: { year: 1783, month: 9, day: 18 },
    domains: ['algebra', 'analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'lagrange',
    nativeName: 'Joseph-Louis Lagrange',
    country: 'italy',
    portrait: '/portraits/lagrange.jpg',
    birth: { year: 1736, month: 1, day: 25 },
    death: { year: 1813, month: 4, day: 10 },
    domains: ['algebra', 'analysis', 'numberTheory'],
  },
  {
    id: 'laplace',
    nativeName: 'Pierre-Simon Laplace',
    country: 'france',
    portrait: '/portraits/laplace.jpg',
    birth: { year: 1749, month: 3, day: 23 },
    death: { year: 1827, month: 3, day: 5 },
    domains: ['analysis'],
  },
  {
    id: 'fourier',
    nativeName: 'Joseph Fourier',
    country: 'france',
    portrait: '/portraits/fourier.jpg',
    birth: { year: 1768, month: 3, day: 21 },
    death: { year: 1830, month: 5, day: 16 },
    domains: ['analysis'],
  },
  {
    id: 'gauss',
    nativeName: 'Carl Friedrich Gauss',
    country: 'germany',
    portrait: '/portraits/gauss.jpg',
    birth: { year: 1777, month: 4, day: 30 },
    death: { year: 1855, month: 2, day: 23 },
    domains: ['algebra', 'analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'cauchy',
    nativeName: 'Augustin-Louis Cauchy',
    country: 'france',
    portrait: '/portraits/cauchy.jpg',
    birth: { year: 1789, month: 8, day: 21 },
    death: { year: 1857, month: 5, day: 23 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'abel',
    nativeName: 'Niels Henrik Abel',
    country: 'norway',
    portrait: '/portraits/abel.jpg',
    birth: { year: 1802, month: 8, day: 5 },
    death: { year: 1829, month: 4, day: 6 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'galois',
    nativeName: 'Évariste Galois',
    country: 'france',
    portrait: '/portraits/galois.jpg',
    birth: { year: 1811, month: 10, day: 25 },
    death: { year: 1832, month: 5, day: 31 },
    domains: ['algebra'],
  },
  {
    id: 'weierstrass',
    nativeName: 'Karl Weierstrass',
    country: 'germany',
    portrait: '/portraits/weierstrass.jpg',
    birth: { year: 1815, month: 10, day: 31 },
    death: { year: 1897, month: 2, day: 19 },
    domains: ['analysis'],
  },
  {
    id: 'riemann',
    nativeName: 'Bernhard Riemann',
    country: 'germany',
    portrait: '/portraits/riemann.jpg',
    birth: { year: 1826, month: 9, day: 17 },
    death: { year: 1866, month: 7, day: 20 },
    domains: ['analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'cantor',
    nativeName: 'Georg Cantor',
    country: 'germany',
    portrait: '/portraits/cantor.jpg',
    birth: { year: 1845, month: 3, day: 3 },
    death: { year: 1918, month: 1, day: 6 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'poincare',
    nativeName: 'Henri Poincaré',
    country: 'france',
    portrait: '/portraits/poincare.jpg',
    birth: { year: 1854, month: 4, day: 29 },
    death: { year: 1912, month: 7, day: 17 },
    domains: ['analysis', 'geometry'],
  },
  {
    id: 'hilbert',
    nativeName: 'David Hilbert',
    country: 'germany',
    portrait: '/portraits/hilbert.jpg',
    birth: { year: 1862, month: 1, day: 23 },
    death: { year: 1943, month: 2, day: 14 },
    domains: ['algebra', 'analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'noether',
    nativeName: 'Emmy Noether',
    country: 'germany',
    portrait: '/portraits/noether.jpg',
    birth: { year: 1882, month: 3, day: 23 },
    death: { year: 1935, month: 4, day: 14 },
    domains: ['algebra'],
  },
  {
    id: 'kolmogorov',
    nativeName: 'Andrey Kolmogorov',
    country: 'russia',
    portrait: '/portraits/kolmogorov.jpg',
    birth: { year: 1903, month: 4, day: 25 },
    death: { year: 1987, month: 10, day: 20 },
    domains: ['analysis'],
  },
  {
    id: 'vonNeumann',
    nativeName: 'John von Neumann',
    country: 'hungary',
    portrait: '/portraits/vonNeumann.jpg',
    birth: { year: 1903, month: 12, day: 28 },
    death: { year: 1957, month: 2, day: 8 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'godel',
    nativeName: 'Kurt Gödel',
    country: 'austria',
    portrait: '/portraits/godel.jpg',
    birth: { year: 1906, month: 4, day: 28 },
    death: { year: 1978, month: 1, day: 14 },
    domains: ['algebra'],
  },
  {
    id: 'grothendieck',
    nativeName: 'Alexander Grothendieck',
    country: 'france',
    portrait: '/portraits/grothendieck.jpg',
    birth: { year: 1928, month: 3, day: 28 },
    death: { year: 2014, month: 11, day: 13 },
    domains: ['algebra', 'geometry', 'numberTheory'],
  },
]

export function hasDomain(
  person: Mathematician,
  domain: MathDomainId,
): boolean {
  return person.domains.includes(domain)
}
