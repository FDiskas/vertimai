import { Check, Columns2, Copy, Loader2, Plus, Settings, Sparkles, Trash2 } from 'lucide-react'
import { Fragment, useState } from 'react'
import type { FormEvent } from 'react'
import { useOpenAITranslate } from '../hooks/useOpenAITranslate'
import { parseStructuredTranslationValue } from '../lib/translation-utils'
import { useTranslationStore } from '../store/useTranslationStore'
import { translate, withParams } from '../templates/translate-template'
import translateTemplateSource from '../templates/translate-template.ts?raw'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

interface TranslationGridProps {
  baseLanguage: string
  visibleKeys: string[]
  translations: Record<string, Record<string, string>>
  onUpdate: (key: string, language: string, value: string) => Promise<void>
  onDeleteKey: (key: string) => void
  onError: (message: string) => void
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
  onError,
}: TranslationGridProps) {
  const apiKey = useTranslationStore((state) => state.apiKey)
  const allLanguages = useTranslationStore((state) => state.languages)
  const selectedLanguages = useTranslationStore((state) => state.selectedLanguages)
  const setSelectedLanguages = useTranslationStore((state) => state.setSelectedLanguages)
  const getCompletion = useTranslationStore((state) => state.getCompletion)
  const addLanguage = useTranslationStore((state) => state.addLanguage)
  const removeLanguage = useTranslationStore((state) => state.removeLanguage)
  const { translate: requestTranslate, isTranslating } = useOpenAITranslate()
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [newLanguageCode, setNewLanguageCode] = useState('')

  const submitLanguage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = newLanguageCode.trim()
    if (!code) return
    await addLanguage(code)
    setNewLanguageCode('')
  }

  const rightLanguage = selectedLanguages[1]
  const fallbackLanguage = allLanguages.find((language) => language !== baseLanguage) ?? baseLanguage
  const comparisonLanguages = rightLanguage && rightLanguage !== baseLanguage ? [rightLanguage] : [fallbackLanguage]

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
      onError(error instanceof Error ? error.message : 'Unknown error')
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
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error')
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Languages modal */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 items-center gap-1.5 rounded px-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                title={translate.sidebarTitle}
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{translate.sidebarTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                {allLanguages.map((language) => {
                  const completion = getCompletion(language)
                  const isBase = language === baseLanguage
                  return (
                    <div key={language} className="surface-subtle space-y-2 px-3 py-2 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-stone-800">{language}</span>
                        <div className="flex items-center gap-2">
                          <Badge>{completion.percent}% ({completion.translated}/{completion.total})</Badge>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-500 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => void removeLanguage(language)}
                            disabled={isBase}
                            title={isBase ? translate.sidebarBaseLanguageCannotBeRemoved : withParams(translate.sidebarRemoveLanguage, { language })}
                            aria-label={isBase ? translate.sidebarBaseLanguageCannotBeRemoved : withParams(translate.sidebarRemoveLanguage, { language })}
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
                <form className="space-y-2 border-t border-stone-200 pt-3" onSubmit={(event) => void submitLanguage(event)}>
                  <label htmlFor="grid-new-language" className="block text-xs font-medium uppercase tracking-wide text-stone-500">
                    {translate.sidebarAddLanguage}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="grid-new-language"
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
              </div>
            </DialogContent>
          </Dialog>

        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Split view modal */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 items-center gap-1.5 rounded px-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                title="Split view"
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{translate.sidebarDescription}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">{translate.sidebarLeft}</label>
                  <select
                    className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                    value={selectedLanguages[0]}
                    onChange={(event) => setSelectedLanguages(event.target.value, selectedLanguages[1])}
                  >
                    {allLanguages.map((language) => (
                      <option key={`left-${language}`} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">{translate.sidebarRight}</label>
                  <select
                    className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                    value={selectedLanguages[1]}
                    onChange={(event) => setSelectedLanguages(selectedLanguages[0], event.target.value)}
                  >
                    {allLanguages.map((language) => (
                      <option key={`right-${language}`} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
              </div>
            </DialogContent>
          </Dialog> 
        </div>
     </div>
      <div className="text-sm">
        <div className="sticky top-0 z-10 hidden sm:grid sm:grid-cols-2 bg-stone-100/95 backdrop-blur border-b border-stone-200">
          <div className="px-3 py-3 font-semibold text-stone-700">{withParams(translate.gridMainLanguage, { language: baseLanguage })}</div>
          {comparisonLanguages.map((language) => (
            <div key={`header-${language}`} className="px-3 py-3 font-semibold text-stone-700">
              {withParams(translate.gridTranslation, { language })}
            </div>
          ))}
        </div>
        {visibleKeys.map((key) => {
          const entry = translations[key]
          const baseRaw = entry[baseLanguage] ?? ''
          const baseStructured = parseStructuredTranslationValue(baseRaw) as StructuredValue | null

          return (
            <Fragment key={key}>
              <div className="border-t-2 border-stone-100 bg-stone-50 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-xs text-stone-400"
                    title={key}
                    aria-label={withParams(translate.gridTranslationKeyAria, { key })}
                  >
                    {key}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-stone-400 transition hover:bg-stone-200 hover:text-stone-700"
                    onClick={() => void copyKey(key)}
                    aria-label={translate.gridCopyKey}
                    title={translate.gridCopyKey}
                  >
                    {copiedKey === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => onDeleteKey(key)}
                    aria-label={translate.gridDeleteKey}
                    title={translate.gridDeleteKey}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-stone-100 bg-white hover:bg-[#fff9ea]">
                <div className="px-3 py-3 sm:border-r sm:border-stone-100">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 sm:hidden">
                    {withParams(translate.gridMainLanguage, { language: baseLanguage })}
                  </p>
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
                      className="min-h-[52px] bg-white"
                    />
                  )}
                </div>
                {comparisonLanguages.map((language) => {
                  const cellId = `${key}:${language}`
                  const structured = getStructuredForLanguage(baseRaw, entry[language] ?? '')
                  const progress = structured ? getStructuredProgress(structured) : null
                  const isEmpty = progress ? progress.filled < progress.total : !(entry[language] ?? '').trim()

                  return (
                    <div key={cellId} className="px-3 py-3 border-t border-stone-100 sm:border-t-0">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 sm:hidden">
                        {withParams(translate.gridTranslation, { language })}
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          className="absolute right-1.5 top-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => void (structured ? translateStructuredCell(key, language) : translateCell(key, language))}
                          disabled={!apiKey.trim() || (isTranslating && activeCell !== cellId)}
                          aria-label="AI Translate"
                          title="AI Translate"
                        >
                          {activeCell === cellId
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5" />}
                        </button>
                        {structured ? (
                          <div className="space-y-2 pr-8">
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
                            className={`min-h-[52px] pr-8 ${isEmpty ? 'border-amber-300 bg-amber-50/40' : 'bg-white'}`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
