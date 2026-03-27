import { Download, Plus, RotateCcw, Search, X } from 'lucide-react'
import { useHotkey } from '@tanstack/react-hotkeys'

import { translate, withParams } from '../templates/translate-template'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ToolbarProps {
  search: string
  untranslatedOnly: boolean
  fileName: string
  visibleCount: number
  totalCount: number
  onSearch: (value: string) => void
  onToggleUntranslated: (value: boolean) => void
  onAddKey: () => void
  onExport: () => void
  onReset: () => void
}

export function Toolbar({
  search,
  untranslatedOnly,
  fileName,
  visibleCount,
  totalCount,
  onSearch,
  onToggleUntranslated,
  onAddKey,
  onExport,
  onReset,
}: ToolbarProps) {

  useHotkey('Control+N', onAddKey, { preventDefault: true, stopPropagation: true })

  return (
    <div className="surface-panel px-4 py-3 space-y-2">
      {/* Row 1: file info + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-stone-800" title={fileName}>{fileName}</span>
        <span className="label-chip shrink-0">
          {withParams(translate.toolbarShowing, { visible: visibleCount, total: totalCount })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={onAddKey} title="Add new key (Ctrl+N)" aria-label="Add new key (Ctrl+N)">
            <Plus className="mr-2 h-4 w-4" />
            {translate.toolbarAddNewKey}
          </Button>
          <Button onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            {translate.commonExport}
          </Button>
          <div className="h-6 w-px bg-stone-200" aria-hidden="true" />
          <Button
            variant="destructive"
            size="icon"
            onClick={onReset}
            title={translate.commonClear}
            aria-label={translate.commonClear}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row 2: search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            className="pl-9 pr-9"
            placeholder={translate.toolbarSearchPlaceholder}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label={translate.toolbarClearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm text-stone-700 select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={untranslatedOnly}
              onChange={(event) => onToggleUntranslated(event.target.checked)}
            />
            <div className="h-5 w-9 rounded-full border border-stone-300 bg-stone-100 transition peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400 peer-focus-visible:ring-offset-1" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
          </div>
          {translate.toolbarUntranslatedOnly}
        </label>
      </div>
    </div>
  )
}
