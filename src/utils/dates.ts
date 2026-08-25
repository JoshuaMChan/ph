import type { DateMark } from '../types'

/** `bce` uses `{n}` for the absolute year, e.g. `公元前{n}` or `{n} BCE`. */
export function formatYear(year: number, bce: string): string {
  const n = Math.abs(year)
  if (year >= 0) return String(n)
  return bce.replaceAll('{n}', String(n))
}

export function formatLifespan(birth: DateMark, death: DateMark, bce: string): string {
  return `${formatYear(birth.year, bce)}–${formatYear(death.year, bce)}`
}

export function formatEraYears(start: number, end: number, bce: string): string {
  return `${formatYear(start, bce)}–${formatYear(end, bce)}`
}
