import { Check, Copy, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useOpenAITranslate } from '../hooks/useOpenAITranslate'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface TranslationGridProps {
  baseLanguage: string
  leftLanguage: string
  rightLanguage: string
  visibleKeys: string[]
  translations: Record<string, Record<string, string>>
  apiKey: string
  onUpdate: (key: string, language: string, value: string) => Promise<void>
}

export function TranslationGrid({
  baseLanguage,
  leftLanguage,
  rightLanguage,
  visibleKeys,
  translations,
  apiKey,
  onUpdate,
}: TranslationGridProps) {
  const { translate, isTranslating } = useOpenAITranslate()
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (visibleKeys.length === 0) {
    return <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">Nėra įrašų.</div>
  }

  const translateCell = async (key: string, language: string) => {
    const source = translations[key]?.[baseLanguage] ?? ''
    const cellId = `${key}:${language}`
    setActiveCell(cellId)

    try {
      const translated = await translate({
        text: source,
        targetLanguage: language,
        sourceLanguage: baseLanguage,
        apiKey,
      })
      await onUpdate(key, language, translated)
    } finally {
      setActiveCell(null)
    }
  }

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1300)
    } catch {
      setCopiedKey(null)
    }
  }

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2 text-xs text-stone-600">
        <p className="font-medium">Lenteleje matote tik aktyvius filtravimo rezultatus.</p>
        <p>
          Bazinis: <span className="font-semibold text-stone-800">{baseLanguage}</span>
        </p>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[1080px] w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-stone-100/95 backdrop-blur">
          <tr>
            <th className="border-b border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">Key</th>
            <th className="border-b border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">Original ({baseLanguage})</th>
            <th className="border-b border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">Split Left ({leftLanguage})</th>
            <th className="border-b border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">Split Right ({rightLanguage})</th>
          </tr>
          </thead>
          <tbody>
            {visibleKeys.map((key) => {
              const entry = translations[key]
              return (
                <tr key={key} className="group align-top odd:bg-white even:bg-[#fffdf7] hover:bg-[#fff9ea]">
                  <td className="border-b border-stone-100 px-3 py-3 align-top">
                    <div className="space-y-2">
                      <p className="font-mono text-xs text-stone-700">{key}</p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 transition group-hover:border-stone-300 group-hover:bg-white"
                        onClick={() => void copyKey(key)}
                      >
                        {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedKey === key ? 'Copied' : 'Copy key'}
                      </button>
                    </div>
                  </td>
                  <td className="border-b border-stone-100 px-3 py-3">
                    <Textarea
                      value={entry[baseLanguage] ?? ''}
                      onChange={(event) => void onUpdate(key, baseLanguage, event.target.value)}
                      className="min-h-20 bg-white"
                    />
                  </td>
                  {[leftLanguage, rightLanguage].map((language) => {
                    const cellId = `${key}:${language}`
                    const isEmpty = !(entry[language] ?? '').trim()

                    return (
                      <td key={cellId} className="border-b border-stone-100 px-3 py-3">
                        <div className="space-y-2">
                          <Textarea
                            value={entry[language] ?? ''}
                            onChange={(event) => void onUpdate(key, language, event.target.value)}
                            className={`min-h-20 ${isEmpty ? 'border-amber-300 bg-amber-50/40' : 'bg-white'}`}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-medium ${isEmpty ? 'text-amber-700' : 'text-stone-400'}`}>
                              {isEmpty ? 'Missing translation' : `${(entry[language] ?? '').length} chars`}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => void translateCell(key, language)}
                              disabled={isTranslating && activeCell !== cellId}
                            >
                              <Sparkles className="mr-2 h-3.5 w-3.5" />
                              {activeCell === cellId ? 'Verciama...' : 'AI Translate'}
                            </Button>
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
