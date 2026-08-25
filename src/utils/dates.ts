import type { DateMark } from '../types'

export function formatYear(year: number): string {
  const n = Math.abs(year)
  if (year >= 0) return String(n)
  return `${n} BC`
}

export function formatLifespan(birth: DateMark, death: DateMark): string {
  return formatRange(birth.year, death.year)
}

export function formatEraYears(start: number, end: number): string {
  return formatRange(start, end)
}

function formatRange(start: number, end: number): string {
  if (start < 0 && end < 0) {
    return `${Math.abs(start)}–${Math.abs(end)} BC`
  }
  if (start < 0) {
    return `${Math.abs(start)} BC–${end}`
  }
  if (end < 0) {
    return `${start}–${Math.abs(end)} BC`
  }
  return `${start}–${end}`
}
