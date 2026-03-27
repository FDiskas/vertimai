import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { translate, withParams } from '../templates/translate-template'
import type { LanguageCode } from '../types/translation'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface LanguageSidebarProps {
  languages: LanguageCode[]
  baseLanguage: LanguageCode
  selected: [LanguageCode, LanguageCode]
  onSelect: (left: LanguageCode, right: LanguageCode) => void
  onAddLanguage: (language: LanguageCode) => Promise<void>
  onRemoveLanguage: (language: LanguageCode) => Promise<void>
  getCompletion: (language: LanguageCode) => { percent: number; translated: number; total: number }
}

export function LanguageSidebar({
  languages,
  baseLanguage,
  selected,
  onSelect,
  onAddLanguage,
  onRemoveLanguage,
  getCompletion,
}: LanguageSidebarProps) {
  const [newLanguageCode, setNewLanguageCode] = useState('')

  const submitLanguage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = newLanguageCode.trim()
    if (!code) {
      return
    }

    await onAddLanguage(code)
    setNewLanguageCode('')
  }

  return (
    <aside className="surface-panel h-fit space-y-4 p-4 md:sticky md:top-[76px]">
      <div>
        <h2 className="text-base font-semibold text-stone-900">{translate.sidebarTitle}</h2>
        <p className="text-xs text-stone-600">{translate.sidebarDescription}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">{translate.sidebarLeft}</label>
        <select
          className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          value={selected[0]}
          onChange={(event) => onSelect(event.target.value, selected[1])}
        >
          {languages.map((language) => (
            <option key={`left-${language}`} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">{translate.sidebarRight}</label>
        <select
          className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          value={selected[1]}
          onChange={(event) => onSelect(selected[0], event.target.value)}
        >
          {languages.map((language) => (
            <option key={`right-${language}`} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 pt-2">
        {languages.map((language) => {
          const completion = getCompletion(language)
          const isBaseLanguage = language === baseLanguage

          return (
            <div key={language} className="surface-subtle space-y-2 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-800">{language}</span>
                <div className="flex items-center gap-2">
                  <Badge>
                    {completion.percent}% ({completion.translated}/{completion.total})
                  </Badge>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-500 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void onRemoveLanguage(language)}
                    disabled={isBaseLanguage}
                    title={
                      isBaseLanguage
                        ? translate.sidebarBaseLanguageCannotBeRemoved
                        : withParams(translate.sidebarRemoveLanguage, { language })
                    }
                    aria-label={
                      isBaseLanguage
                        ? translate.sidebarBaseLanguageCannotBeRemoved
                        : withParams(translate.sidebarRemoveLanguage, { language })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-2 rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${completion.percent}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <form className="space-y-2 border-t border-stone-200 pt-3" onSubmit={(event) => void submitLanguage(event)}>
        <label htmlFor="new-language" className="block text-xs font-medium uppercase tracking-wide text-stone-500">
          {translate.sidebarAddLanguage}
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="new-language"
            placeholder={translate.sidebarAddLanguagePlaceholder}
            value={newLanguageCode}
            onChange={(event) => setNewLanguageCode(event.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm" className="shrink-0">
            <Plus className="mr-2 h-3.5 w-3.5" />
            {translate.commonAdd}
          </Button>
        </div>
      </form>
    </aside>
  )
}
