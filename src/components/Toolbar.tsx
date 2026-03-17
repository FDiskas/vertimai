import { Download, Plus, Search, X } from 'lucide-react'
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
}: ToolbarProps) {
  return (
    <div className="surface-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Darbo failas</p>
          <p className="text-sm font-medium text-stone-800">{fileName}</p>
        </div>
        <span className="label-chip">
          Rodoma {visibleCount} / {totalCount}
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          className="pl-9 pr-9"
          placeholder="Paieska pagal rakta ar reiksme..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Isvalyti paieska"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          <input type="checkbox" checked={untranslatedOnly} onChange={(event) => onToggleUntranslated(event.target.checked)} />
          Tik neisversti
        </label>
        <Button variant="secondary" onClick={onAddKey}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Key
        </Button>
        <Button onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
