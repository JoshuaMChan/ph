export type Locale = 'zh' | 'en' | 'ja'

export type DateMark = {
  year: number
  month?: number
  day?: number
  circa?: boolean
}

export type Place = {
  city: string
  region: string
  lat: number
  lng: number
  countryId: string
}

export type Philosopher = {
  id: string
  nativeName: string
  country: string
  portrait: string
  birth: DateMark
  death?: DateMark
  born: Place
  died?: Place
}

export type School = {
  id: string
  people: string[]
  yearStart: number
  yearEnd: number
  circa?: boolean
  regionKeys: string[]
  countryIds: string[]
  accent: string
}
