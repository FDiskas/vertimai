import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { enUiMessages } from './locales/en'
import { ltUiMessages } from './locales/lt'

export type UiLocale = 'en' | 'lt'

type TranslationParams = Record<string, string | number>

type UiMessages = typeof enUiMessages

type UiMessageKey = keyof UiMessages

interface UiI18nValue {
  locale: UiLocale
  setLocale: (locale: UiLocale) => void
  t: (key: UiMessageKey, params?: TranslationParams) => string
}

const STORAGE_KEY = 'vertimai-ui-locale'

const localeMessages: Record<UiLocale, UiMessages> = {
  en: enUiMessages,
  lt: ltUiMessages,
}

const UiI18nContext = createContext<UiI18nValue | null>(null)

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_match, token: string) => {
    const value = params[token]
    return value === undefined ? `{${token}}` : String(value)
  })
}

function getInitialLocale(): UiLocale {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'lt' ? 'lt' : 'en'
}

export function UiI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(getInitialLocale)

  const setLocale = (nextLocale: UiLocale) => {
    setLocaleState(nextLocale)
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
  }

  const value = useMemo<UiI18nValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, params) => {
        const message = localeMessages[locale][key] ?? localeMessages.en[key]
        return interpolate(message, params)
      },
    }
  }, [locale])

  return <UiI18nContext.Provider value={value}>{children}</UiI18nContext.Provider>
}

export function useUiI18n() {
  const context = useContext(UiI18nContext)

  if (!context) {
    throw new Error('useUiI18n must be used within UiI18nProvider')
  }

  return context
}
