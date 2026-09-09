import type { DateMark } from '../types'

export type MathDomainId =
  | 'algebra'
  | 'analysis'
  | 'geometry'
  | 'numberTheory'

export type Mathematician = {
  id: string
  nativeName: string
  birth: DateMark
  death?: DateMark
  domains: MathDomainId[]
}

/** Four parallel axes — left→right is time. */
export const mathDomainOrder: MathDomainId[] = [
  'algebra',
  'analysis',
  'geometry',
  'numberTheory',
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
    birth: { year: -325, circa: true },
    death: { year: -265, circa: true },
    domains: ['geometry', 'numberTheory'],
  },
  {
    id: 'archimedes',
    nativeName: 'Archimedes',
    birth: { year: -287 },
    death: { year: -212 },
    domains: ['analysis', 'geometry'],
  },
  {
    id: 'descartes',
    nativeName: 'René Descartes',
    birth: { year: 1596, month: 3, day: 31 },
    death: { year: 1650, month: 2, day: 11 },
    domains: ['algebra', 'geometry'],
  },
  {
    id: 'fermat',
    nativeName: 'Pierre de Fermat',
    birth: { year: 1607 },
    death: { year: 1665, month: 1, day: 12 },
    domains: ['analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'newton',
    nativeName: 'Isaac Newton',
    birth: { year: 1643, month: 1, day: 4 },
    death: { year: 1727, month: 3, day: 31 },
    domains: ['analysis', 'geometry'],
  },
  {
    id: 'leibniz',
    nativeName: 'Gottfried Wilhelm Leibniz',
    birth: { year: 1646, month: 7, day: 1 },
    death: { year: 1716, month: 11, day: 14 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'euler',
    nativeName: 'Leonhard Euler',
    birth: { year: 1707, month: 4, day: 15 },
    death: { year: 1783, month: 9, day: 18 },
    domains: ['algebra', 'analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'lagrange',
    nativeName: 'Joseph-Louis Lagrange',
    birth: { year: 1736, month: 1, day: 25 },
    death: { year: 1813, month: 4, day: 10 },
    domains: ['algebra', 'analysis', 'numberTheory'],
  },
  {
    id: 'laplace',
    nativeName: 'Pierre-Simon Laplace',
    birth: { year: 1749, month: 3, day: 23 },
    death: { year: 1827, month: 3, day: 5 },
    domains: ['analysis'],
  },
  {
    id: 'fourier',
    nativeName: 'Joseph Fourier',
    birth: { year: 1768, month: 3, day: 21 },
    death: { year: 1830, month: 5, day: 16 },
    domains: ['analysis'],
  },
  {
    id: 'gauss',
    nativeName: 'Carl Friedrich Gauss',
    birth: { year: 1777, month: 4, day: 30 },
    death: { year: 1855, month: 2, day: 23 },
    domains: ['algebra', 'analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'cauchy',
    nativeName: 'Augustin-Louis Cauchy',
    birth: { year: 1789, month: 8, day: 21 },
    death: { year: 1857, month: 5, day: 23 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'abel',
    nativeName: 'Niels Henrik Abel',
    birth: { year: 1802, month: 8, day: 5 },
    death: { year: 1829, month: 4, day: 6 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'galois',
    nativeName: 'Évariste Galois',
    birth: { year: 1811, month: 10, day: 25 },
    death: { year: 1832, month: 5, day: 31 },
    domains: ['algebra'],
  },
  {
    id: 'weierstrass',
    nativeName: 'Karl Weierstrass',
    birth: { year: 1815, month: 10, day: 31 },
    death: { year: 1897, month: 2, day: 19 },
    domains: ['analysis'],
  },
  {
    id: 'riemann',
    nativeName: 'Bernhard Riemann',
    birth: { year: 1826, month: 9, day: 17 },
    death: { year: 1866, month: 7, day: 20 },
    domains: ['analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'cantor',
    nativeName: 'Georg Cantor',
    birth: { year: 1845, month: 3, day: 3 },
    death: { year: 1918, month: 1, day: 6 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'poincare',
    nativeName: 'Henri Poincaré',
    birth: { year: 1854, month: 4, day: 29 },
    death: { year: 1912, month: 7, day: 17 },
    domains: ['analysis', 'geometry'],
  },
  {
    id: 'hilbert',
    nativeName: 'David Hilbert',
    birth: { year: 1862, month: 1, day: 23 },
    death: { year: 1943, month: 2, day: 14 },
    domains: ['algebra', 'analysis', 'geometry', 'numberTheory'],
  },
  {
    id: 'noether',
    nativeName: 'Emmy Noether',
    birth: { year: 1882, month: 3, day: 23 },
    death: { year: 1935, month: 4, day: 14 },
    domains: ['algebra'],
  },
  {
    id: 'kolmogorov',
    nativeName: 'Andrey Kolmogorov',
    birth: { year: 1903, month: 4, day: 25 },
    death: { year: 1987, month: 10, day: 20 },
    domains: ['analysis'],
  },
  {
    id: 'vonNeumann',
    nativeName: 'John von Neumann',
    birth: { year: 1903, month: 12, day: 28 },
    death: { year: 1957, month: 2, day: 8 },
    domains: ['algebra', 'analysis'],
  },
  {
    id: 'godel',
    nativeName: 'Kurt Gödel',
    birth: { year: 1906, month: 4, day: 28 },
    death: { year: 1978, month: 1, day: 14 },
    domains: ['algebra'],
  },
  {
    id: 'grothendieck',
    nativeName: 'Alexander Grothendieck',
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
