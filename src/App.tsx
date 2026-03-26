import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, Download } from 'lucide-react'
import { LanguageSidebar } from './components/LanguageSidebar'
import { SettingsDialog } from './components/SettingsDialog'
import { Toolbar } from './components/Toolbar'
import { TranslationGrid } from './components/TranslationGrid'
import { UploadZone } from './components/UploadZone'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './components/ui/toast'
import { useTranslationStore } from './store/useTranslationStore'

type ToastState = {
  open: boolean
  title: string
  description: string
  variant: 'default' | 'destructive'
}

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [addKeyOpen, setAddKeyOpen] = useState(false)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [newKeyDraft, setNewKeyDraft] = useState('')
  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
  })
  const lastErrorRef = useRef<string | null>(null)

  const {
    fileName,
    translations,
    languages,
    baseLanguage,
    selectedLanguages,
    search,
    untranslatedOnly,
    isReady,
    initialize,
    importFile,
    updateTranslation,
    addKey,
    removeKey,
    addLanguage,
    removeLanguage,
    setSearch,
    setUntranslatedOnly,
    setSelectedLanguages,
    exportJson,
    getCompletion,
    getVisibleKeys,
    clearAll,
  } = useTranslationStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 280)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const visibleKeys = getVisibleKeys()
  const totalKeys = Object.keys(translations).length
  const visibleCount = visibleKeys.length
  const rightCompletion = getCompletion(selectedLanguages[1])
  const untranslatedOnRight = totalKeys - rightCompletion.translated

  const showToast = useCallback((next: Omit<ToastState, 'open'>) => {
    setToast({ ...next, open: true })
  }, [])

  useEffect(() => {
    const notifyError = (nextError: string) => {
      if (!nextError || nextError === lastErrorRef.current) {
        return
      }

      lastErrorRef.current = nextError
      showToast({
        title: 'Error',
        description: nextError,
        variant: 'destructive',
      })
    }

    notifyError(useTranslationStore.getState().error ?? '')

    const unsubscribe = useTranslationStore.subscribe((state, prevState) => {
      if (state.error === prevState.error || !state.error) {
        return
      }

      notifyError(state.error)
    })

    return unsubscribe
  }, [showToast])

  const onAddKey = () => {
    setNewKeyDraft('')
    setAddKeyOpen(true)
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

  const onConfirmAddKey = async () => {
    const normalized = newKeyDraft.trim()

    if (!normalized) {
      showToast({
        title: 'Error',
        description: 'Key cannot be empty.',
        variant: 'destructive',
      })
      return
    }

    await addKey(normalized)
    const nextError = useTranslationStore.getState().error

    if (nextError) {
      lastErrorRef.current = nextError
      showToast({
        title: 'Failed to add key',
        description: nextError,
        variant: 'destructive',
      })
      return
    }

    setAddKeyOpen(false)
    setNewKeyDraft('')
    showToast({
      title: 'Done',
      description: `Key "${normalized}" added successfully.`,
      variant: 'default',
    })
  }

  const onDeleteKey = (key: string) => {
    setDeleteKey(key)
  }

  const onReset = () => {
    setResetOpen(true)
  }

  const onConfirmDeleteKey = async () => {
    if (!deleteKey) {
      return
    }

    await removeKey(deleteKey)
    const nextError = useTranslationStore.getState().error

    if (nextError) {
      lastErrorRef.current = nextError
      showToast({
        title: 'Failed to delete key',
        description: nextError,
        variant: 'destructive',
      })
      return
    }

    showToast({
      title: 'Done',
      description: `Key "${deleteKey}" deleted.`,
      variant: 'default',
    })
    setDeleteKey(null)
  }

  const onConfirmReset = async () => {
    await clearAll()
    setResetOpen(false)
    showToast({
      title: 'Done',
      description: 'All data has been cleared.',
      variant: 'default',
    })
  }

  const onScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-stone-600">Loading...</div>
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-[#e9ddc6] bg-[#fff9ed]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">Translation Studio</h1>
            <p className="text-xs text-stone-600">Fast client-side JSON translation editor with AI assistance</p>
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
          baseLanguage={baseLanguage}
          selected={selectedLanguages}
          onSelect={setSelectedLanguages}
          onAddLanguage={addLanguage}
          onRemoveLanguage={removeLanguage}
          getCompletion={getCompletion}
        />

        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Translation keys</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{totalKeys}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Shown after filter</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{visibleCount}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Untranslated ({selectedLanguages[1]})</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{Math.max(untranslatedOnRight, 0)}</p>
            </div>
          </div>

          <UploadZone onFileLoaded={importFile} />

          <div className="sticky top-[72px] z-10 md:top-[78px]">
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
              onReset={onReset}
            />
          </div>

          <TranslationGrid
            baseLanguage={baseLanguage}
            visibleKeys={visibleKeys}
            translations={translations}
            onUpdate={updateTranslation}
            onDeleteKey={onDeleteKey}
          />
        </section>
      </main>

      <Button
        size="icon"
        className={`fixed bottom-5 right-5 z-30 rounded-full shadow-lg transition-all duration-200 md:bottom-7 md:right-7 ${
          showScrollTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        onClick={onScrollTop}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>

      <AlertDialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add new key</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new translation key (for example, home.title).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newKeyDraft}
            onChange={(event) => setNewKeyDraft(event.target.value)}
            placeholder="home.title"
          />
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => void onConfirmAddKey()}>Add</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteKey)} onOpenChange={(open) => !open && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete key?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteKey
                ? `Are you sure you want to delete key "${deleteKey}"?`
                : 'Are you sure you want to delete this key?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => void onConfirmDeleteKey()}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all imported translations, your API key, and IndexedDB data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => void onConfirmReset()}>
                Clear
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastProvider>
        <Toast
          open={toast.open}
          onOpenChange={(open) => setToast((current) => ({ ...current, open }))}
          variant={toast.variant === 'destructive' ? 'destructive' : 'default'}
          duration={2600}
        >
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  )
}

export default App
