import { Check, Copy, Sparkles, Trash2 } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useOpenAITranslate } from '../hooks/useOpenAITranslate'
import { parseStructuredTranslationValue } from '../lib/translation-utils'
import { useTranslationStore } from '../store/useTranslationStore'
import { translate, withParams } from '../templates/translate-template'
import translateTemplateSource from '../templates/translate-template.ts?raw'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

interface TranslationGridProps {
  baseLanguage: string
  visibleKeys: string[]
  translations: Record<string, Record<string, string>>
  onUpdate: (key: string, language: string, value: string) => Promise<void>
  onDeleteKey: (key: string) => void
}

interface StructuredValue {
  [key: string]: string | StructuredValue
}

interface StructuredLeaf {
  path: string
  value: string
}

function flattenStructuredLeaves(value: StructuredValue, parentPath = ''): StructuredLeaf[] {
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = parentPath ? `${parentPath}.${key}` : key

    if (typeof nestedValue === 'string') {
      return [{ path, value: nestedValue }]
    }

    return flattenStructuredLeaves(nestedValue, path)
  })
}

function createEmptyFromShape(shape: StructuredValue): StructuredValue {
  const next: StructuredValue = {}

  for (const [key, value] of Object.entries(shape)) {
    next[key] = typeof value === 'string' ? '' : createEmptyFromShape(value)
  }

  return next
}

function mergeStructuredShape(shape: StructuredValue, current: StructuredValue): StructuredValue {
  const next: StructuredValue = { ...current }

  for (const [key, shapeValue] of Object.entries(shape)) {
    const currentValue = next[key]

    if (typeof shapeValue === 'string') {
      next[key] = typeof currentValue === 'string' ? currentValue : ''
      continue
    }

    if (typeof currentValue === 'object' && currentValue !== null) {
      next[key] = mergeStructuredShape(shapeValue, currentValue as StructuredValue)
    } else {
      next[key] = createEmptyFromShape(shapeValue)
    }
  }

  return next
}

function setStructuredLeaf(value: StructuredValue, path: string, nextValue: string): StructuredValue {
  const segments = path.split('.')
  const clone: StructuredValue = { ...value }
  let cursor: StructuredValue = clone

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1

    if (isLast) {
      cursor[segment] = nextValue
      return
    }

    const current = cursor[segment]
    const nextNode = typeof current === 'object' && current !== null ? { ...(current as StructuredValue) } : {}
    cursor[segment] = nextNode
    cursor = nextNode
  })

  return clone
}

function getStructuredForLanguage(baseRaw: string, languageRaw: string): StructuredValue | null {
  const baseStructured = parseStructuredTranslationValue(baseRaw) as StructuredValue | null
  const languageStructured = parseStructuredTranslationValue(languageRaw) as StructuredValue | null

  if (!baseStructured && !languageStructured) {
    return null
  }

  if (baseStructured && languageStructured) {
    return mergeStructuredShape(baseStructured, languageStructured)
  }

  if (baseStructured) {
    return createEmptyFromShape(baseStructured)
  }

  return languageStructured
}

function getStructuredProgress(structured: StructuredValue): { filled: number; total: number } {
  const leaves = flattenStructuredLeaves(structured)
  const filled = leaves.filter((leaf) => leaf.value.trim().length > 0).length
  return { filled, total: leaves.length }
}

export function TranslationGrid({
  baseLanguage,
  visibleKeys,
  translations,
  onUpdate,
  onDeleteKey,
}: TranslationGridProps) {
  const apiKey = useTranslationStore((state) => state.apiKey)
  const allLanguages = useTranslationStore((state) => state.languages)
  const { translate: requestTranslate, isTranslating, error: translateError } = useOpenAITranslate()
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const nonBaseLanguages = allLanguages.filter(
    (language, index, list) => language !== baseLanguage && list.indexOf(language) === index,
  )
  const fallbackLanguage = allLanguages.find((language) => language !== baseLanguage) ?? baseLanguage
  const comparisonLanguages = nonBaseLanguages.length > 0 ? nonBaseLanguages : [fallbackLanguage]

  if (visibleKeys.length === 0) {
    return (
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-stone-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-stone-900">{translate.gridExampleTitle}</h3>
          <p className="mt-1 text-xs text-stone-600">
            {translate.gridExampleDescription}
          </p>
        </div>
        <pre className="max-h-[340px] overflow-auto bg-stone-950 px-4 py-3 text-xs leading-relaxed text-stone-100">
          <code>{translateTemplateSource}</code>
        </pre>
      </div>
    )
  }

  const translateCell = async (key: string, language: string) => {
    const source = translations[key]?.[baseLanguage] ?? ''
    const cellId = `${key}:${language}`
    setActiveCell(cellId)

    try {
      const translated = await requestTranslate({
        text: source,
        targetLanguage: language,
        sourceLanguage: baseLanguage,
        apiKey,
      })
      await onUpdate(key, language, translated)
    } catch (error) {
      // Error state is surfaced from the hook.
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setActiveCell(null)
    }
  }

  const translateStructuredCell = async (key: string, language: string) => {
    const source = translations[key]?.[baseLanguage] ?? ''
    const target = translations[key]?.[language] ?? ''
    const sourceStructured = parseStructuredTranslationValue(source) as StructuredValue | null

    if (!sourceStructured) {
      await translateCell(key, language)
      return
    }

    const initialTarget = getStructuredForLanguage(source, target) ?? createEmptyFromShape(sourceStructured)
    const sourceLeaves = flattenStructuredLeaves(sourceStructured)
    const cellId = `${key}:${language}`
    setActiveCell(cellId)

    try {
      let next = initialTarget

      for (const leaf of sourceLeaves) {
        if (!leaf.value.trim()) {
          continue
        }

        const translated = await requestTranslate({
          text: leaf.value,
          targetLanguage: language,
          sourceLanguage: baseLanguage,
          apiKey,
        })
        next = setStructuredLeaf(next, leaf.path, translated)
      }

      await onUpdate(key, language, JSON.stringify(next))
    } catch {
      // Error state is surfaced from the hook.
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
        <p className="font-medium">{translate.gridFilteredInfo}</p>
        <p>
          {translate.gridMainLanguage} <span className="font-semibold text-stone-800">{baseLanguage}</span>
        </p>
      </div>
      {translateError ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{translateError}</div>
      ) : null}
      <div className="overflow-auto">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-stone-100/95 backdrop-blur">
          <tr>
            <th className="border-b border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">{withParams(translate.gridOriginal, { language: baseLanguage })}</th>
            {comparisonLanguages.map((language) => (
              <th key={`header-${language}`} className="border-b border-stone-200 px-3 py-3 text-left font-semibold text-stone-700">
                {withParams(translate.gridTranslation, { language })}
              </th>
            ))}
          </tr>
          </thead>
          <tbody>
            {visibleKeys.map((key) => {
              const entry = translations[key]
              const baseRaw = entry[baseLanguage] ?? ''
              const baseStructured = parseStructuredTranslationValue(baseRaw) as StructuredValue | null

              return (
                <Fragment key={key}>
                  <tr className="bg-[#fff9ea]">
                    <td colSpan={1 + comparisonLanguages.length} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={key}
                          className="h-8 bg-gray-100/70 font-mono text-xs text-stone-800"
                          onFocus={(event) => event.currentTarget.select()}
                          aria-label={withParams(translate.gridTranslationKeyAria, { key })}
                        />
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300"
                          onClick={() => void copyKey(key)}
                          aria-label={translate.gridCopyKey}
                          title={translate.gridCopyKey}
                        >
                          {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:border-rose-200 hover:text-rose-600"
                          onClick={() => onDeleteKey(key)}
                          aria-label={translate.gridDeleteKey}
                          title={translate.gridDeleteKey}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="group align-top odd:bg-white even:bg-[#fffdf7] hover:bg-[#fff9ea]">
                    <td className="border-b border-stone-100 px-3 py-3">
                      {baseStructured ? (
                        <div className="space-y-2">
                          {flattenStructuredLeaves(baseStructured).map((leaf) => (
                            <div key={`${key}:${baseLanguage}:${leaf.path}`} className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{leaf.path}</p>
                              <Input
                                value={leaf.value}
                                onChange={(event) => {
                                  const current = (parseStructuredTranslationValue(entry[baseLanguage] ?? '') as StructuredValue | null) ?? baseStructured
                                  const next = setStructuredLeaf(current, leaf.path, event.target.value)
                                  void onUpdate(key, baseLanguage, JSON.stringify(next))
                                }}
                                className="h-9 bg-white"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          value={entry[baseLanguage] ?? ''}
                          onChange={(event) => void onUpdate(key, baseLanguage, event.target.value)}
                          className="min-h-20 bg-white"
                        />
                      )}
                    </td>
                    {comparisonLanguages.map((language) => {
                      const cellId = `${key}:${language}`
                      const structured = getStructuredForLanguage(baseRaw, entry[language] ?? '')
                      const progress = structured ? getStructuredProgress(structured) : null
                      const isEmpty = progress ? progress.filled < progress.total : !(entry[language] ?? '').trim()

                      return (
                        <td key={cellId} className="border-b border-stone-100 px-3 py-3">
                          <div className="space-y-2">
                            {structured ? (
                              <div className="space-y-2">
                                {flattenStructuredLeaves(structured).map((leaf) => (
                                  <div key={`${cellId}:${leaf.path}`} className="space-y-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{leaf.path}</p>
                                    <Input
                                      value={leaf.value}
                                      onChange={(event) => {
                                        const next = setStructuredLeaf(structured, leaf.path, event.target.value)
                                        void onUpdate(key, language, JSON.stringify(next))
                                      }}
                                      className={isEmpty ? 'h-9 border-amber-300 bg-amber-50/40' : 'h-9 bg-white'}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Textarea
                                value={entry[language] ?? ''}
                                onChange={(event) => void onUpdate(key, language, event.target.value)}
                                className={`min-h-20 ${isEmpty ? 'border-amber-300 bg-amber-50/40' : 'bg-white'}`}
                              />
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] font-medium ${isEmpty ? 'text-amber-700' : 'text-stone-400'}`}>
                                {progress
                                  ? withParams(translate.gridProgressFields, { filled: progress.filled, total: progress.total })
                                  : isEmpty
                                    ? translate.gridProgressMissing
                                    : withParams(translate.gridProgressChars, { count: (entry[language] ?? '').length })}
                              </span>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  return void (structured ? translateStructuredCell(key, language) : translateCell(key, language))
                                }}
                                disabled={!apiKey.trim() || (isTranslating && activeCell !== cellId)}
                              >
                                <Sparkles className="mr-2 h-3.5 w-3.5" />
                                {activeCell === cellId ? translate.gridTranslating : translate.gridAiTranslate}
                              </Button>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
