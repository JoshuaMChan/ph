import type { DateMark } from '../types'

function yearNumber(year: number): number {
  return Math.abs(year)
}

export function formatLifespan(birth: DateMark, death: DateMark): string {
  return `${yearNumber(birth.year)}–${yearNumber(death.year)}`
}

export function formatEraYears(start: number, end: number): string {
  return `${yearNumber(start)}–${yearNumber(end)}`
}
