import type { DateMark } from '../types'

function absYear(year: number): number {
  return Math.abs(year)
}

/** Mark BCE once on a range when both ends are BCE; CE years stay plain numbers. */
export function formatYearRange(start: number, end: number, locale: string): string {
  const a = absYear(start)
  const b = absYear(end)
  const startBce = start < 0
  const endBce = end < 0

  if (!startBce && !endBce) return `${a}–${b}`

  if (locale === 'en') {
    if (startBce && endBce) return `${a}–${b} BCE`
    if (startBce) return `${a} BCE–${b}`
    return `${a}–${b} BCE`
  }

  // zh / ja: 前 only on the first BCE number in the range
  if (startBce && endBce) return `前${a}–${b}`
  if (startBce) return `前${a}–${b}`
  return `${a}–前${b}`
}

export function formatLifespan(birth: DateMark, death: DateMark, locale: string): string {
  return formatYearRange(birth.year, death.year, locale)
}

export function formatEraYears(start: number, end: number, locale: string): string {
  return formatYearRange(start, end, locale)
}
