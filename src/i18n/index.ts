import { createI18n } from 'vue-i18n'
import en from './en'
import ja from './ja'
import zh from './zh'

export type AppLocale = 'zh' | 'en' | 'ja'

const LOCALE_KEY = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function isLocale(value: string | null | undefined): value is AppLocale {
  return value === 'zh' || value === 'en' || value === 'ja'
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  for (const part of document.cookie.split(';')) {
    const item = part.trim()
    if (item.startsWith(prefix)) {
      return decodeURIComponent(item.slice(prefix.length))
    }
  }
  return null
}

export function setLocaleCookie(locale: AppLocale) {
  document.cookie = [
    `${encodeURIComponent(LOCALE_KEY)}=${encodeURIComponent(locale)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Lax',
  ].join('; ')
  localStorage.setItem(LOCALE_KEY, locale)
}

function detectLocale(): AppLocale {
  const fromCookie = readCookie(LOCALE_KEY)
  if (isLocale(fromCookie)) return fromCookie

  const fromStorage = localStorage.getItem(LOCALE_KEY)
  if (isLocale(fromStorage)) {
    setLocaleCookie(fromStorage)
    return fromStorage
  }

  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, zh, ja },
})
