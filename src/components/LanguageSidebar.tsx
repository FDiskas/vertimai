import type { LanguageCode } from '../types/translation'
import { Badge } from './ui/badge'

interface LanguageSidebarProps {
  languages: LanguageCode[]
  selected: [LanguageCode, LanguageCode]
  onSelect: (left: LanguageCode, right: LanguageCode) => void
  getCompletion: (language: LanguageCode) => { percent: number; translated: number; total: number }
}

export function LanguageSidebar({ languages, selected, onSelect, getCompletion }: LanguageSidebarProps) {
  return (
    <aside className="surface-panel h-fit space-y-4 p-4 md:sticky md:top-[76px]">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Kalbos</h2>
        <p className="text-xs text-stone-600">Pasirinkite dvi kalbas split view rezimui.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">Kaire</label>
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
        <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">Desine</label>
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

          return (
            <div key={language} className="surface-subtle space-y-2 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-800">{language}</span>
                <Badge>
                  {completion.percent}% ({completion.translated}/{completion.total})
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${completion.percent}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
