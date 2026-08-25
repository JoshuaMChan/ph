import { createI18n } from 'vue-i18n'
import en from './en'
import ja from './ja'
import zh from './zh'

export type AppLocale = 'zh' | 'en' | 'ja'

function detectLocale(): AppLocale {
  const saved = localStorage.getItem('locale')
  if (saved === 'zh' || saved === 'en' || saved === 'ja') return saved
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, zh, ja },
})
