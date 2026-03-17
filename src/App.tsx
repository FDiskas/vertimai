import { useEffect } from 'react'
import { Download } from 'lucide-react'
import { LanguageSidebar } from './components/LanguageSidebar'
import { SettingsDialog } from './components/SettingsDialog'
import { Toolbar } from './components/Toolbar'
import { TranslationGrid } from './components/TranslationGrid'
import { UploadZone } from './components/UploadZone'
import { Button } from './components/ui/button'
import { useTranslationStore } from './store/useTranslationStore'

function App() {
  const {
    fileName,
    translations,
    languages,
    baseLanguage,
    selectedLanguages,
    search,
    untranslatedOnly,
    apiKey,
    error,
    isReady,
    initialize,
    importFile,
    updateTranslation,
    addKey,
    setSearch,
    setUntranslatedOnly,
    setSelectedLanguages,
    exportJson,
    getCompletion,
    getVisibleKeys,
  } = useTranslationStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

  const visibleKeys = getVisibleKeys()
  const totalKeys = Object.keys(translations).length
  const visibleCount = visibleKeys.length
  const rightCompletion = getCompletion(selectedLanguages[1])
  const untranslatedOnRight = totalKeys - rightCompletion.translated

  const onAddKey = () => {
    const userKey = window.prompt('Įveskite naują vertimo raktą (pvz. home.title):')
    if (!userKey) {
      return
    }

    void addKey(userKey)
  }

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-stone-600">Kraunama...</div>
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-[#e9ddc6] bg-[#fff9ed]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">Vertimai Studio</h1>
            <p className="text-xs text-stone-600">Greitas client-side JSON vertimu redaktorius su AI pagalba</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Quick Export
            </Button>
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[300px_1fr] md:px-6">
        <LanguageSidebar
          languages={languages}
          selected={selectedLanguages}
          onSelect={setSelectedLanguages}
          getCompletion={getCompletion}
        />

        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Vertimu raktu</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{totalKeys}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rodoma po filtro</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{visibleCount}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Neisversta ({selectedLanguages[1]})</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{Math.max(untranslatedOnRight, 0)}</p>
            </div>
          </div>

          <UploadZone onFileLoaded={importFile} />

          <Toolbar
            search={search}
            untranslatedOnly={untranslatedOnly}
            fileName={fileName}
            visibleCount={visibleCount}
            totalCount={totalKeys}
            onSearch={setSearch}
            onToggleUntranslated={setUntranslatedOnly}
            onAddKey={onAddKey}
            onExport={onExport}
          />

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <TranslationGrid
            baseLanguage={baseLanguage}
            leftLanguage={selectedLanguages[0]}
            rightLanguage={selectedLanguages[1]}
            visibleKeys={visibleKeys}
            translations={translations}
            apiKey={apiKey}
            onUpdate={updateTranslation}
          />
        </section>
      </main>
    </div>
  )
}

export default App
