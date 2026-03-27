import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, Github } from 'lucide-react'
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
import { setTranslateLanguage, translate, withParams } from './templates/translate-template'

type ToastState = {
  open: boolean
  title: string
  description: string
  variant: 'default' | 'destructive'
}

function getInitialUiLanguage(): 'en' | 'lt' {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem('vertimai-ui-locale')
  return stored === 'lt' ? 'lt' : 'en'
}

function App() {
  const [locale, setLocale] = useState<'en' | 'lt'>(() => {
    const initial = getInitialUiLanguage()
    setTranslateLanguage(initial)
    return initial
  })
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
    selectedLanguages,
    search,
    untranslatedOnly,
    isReady,
    initialize,
    importFile,
    loadDemoData,
    updateTranslation,
    addKey,
    removeKey,
    setSearch,
    setUntranslatedOnly,
    exportJson,
    getVisibleKeys,
    clearAll,
  } = useTranslationStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    window.localStorage.setItem('vertimai-ui-locale', locale)
  }, [locale])

  setTranslateLanguage(locale)

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
        title: translate.commonError,
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
        title: translate.commonError,
        description: translate.appToastKeyEmpty,
        variant: 'destructive',
      })
      return
    }

    await addKey(normalized)
    const nextError = useTranslationStore.getState().error

    if (nextError) {
      lastErrorRef.current = nextError
      showToast({
        title: translate.appToastAddKeyFailed,
        description: nextError,
        variant: 'destructive',
      })
      return
    }

    setAddKeyOpen(false)
    setNewKeyDraft('')
    showToast({
      title: translate.commonDone,
      description: withParams(translate.appToastKeyAdded, { key: normalized }),
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
        title: translate.appToastDeleteKeyFailed,
        description: nextError,
        variant: 'destructive',
      })
      return
    }

    showToast({
      title: translate.commonDone,
      description: withParams(translate.appToastKeyDeleted, { key: deleteKey }),
      variant: 'default',
    })
    setDeleteKey(null)
  }

  const onConfirmReset = async () => {
    await clearAll()
    setResetOpen(false)
    showToast({
      title: translate.commonDone,
      description: translate.appToastClearAllDone,
      variant: 'default',
    })
  }

  const onScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-stone-600">{translate.appLoading}</div>
  }

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-[#e9ddc6] bg-[#fff9ed]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">{translate.appTitle}</h1>
            <p className="text-xs text-stone-600">{translate.appSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4 md:px-6">
        <section className="space-y-4">
          {visibleKeys.length === 0 && <UploadZone onFileLoaded={importFile} onLoadDemoData={loadDemoData} />}

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
            baseLanguage={selectedLanguages[0]}
            visibleKeys={visibleKeys}
            translations={translations}
            onUpdate={updateTranslation}
            onDeleteKey={onDeleteKey}
          />
        </section>
      </main>

      <footer className="border-t border-[#e9ddc6] bg-[#fff9ed]/80">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 text-sm text-stone-600 md:px-6">
          <a
            href="https://github.com/FDiskas/vertimai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-stone-700 underline decoration-amber-400 underline-offset-4 hover:text-stone-900"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`text-lg leading-none transition-opacity ${locale === 'en' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              aria-label="English"
              title="English"
            >
              🇬🇧
            </button>
            <button
              type="button"
              onClick={() => setLocale('lt')}
              className={`text-lg leading-none transition-opacity ${locale === 'lt' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              aria-label="Lietuvių"
              title="Lietuvių"
            >
              🇱🇹
            </button>
          </div>
        </div>
      </footer>

      <Button
        size="icon"
        className={`fixed bottom-5 right-5 z-30 rounded-full shadow-lg transition-all duration-200 md:bottom-7 md:right-7 ${
          showScrollTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        onClick={onScrollTop}
        aria-label={translate.appScrollToTop}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>

      <AlertDialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate.dialogAddKeyTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate.dialogAddKeyDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newKeyDraft}
            onChange={(event) => setNewKeyDraft(event.target.value)}
            autoFocus
            placeholder={translate.dialogAddKeyPlaceholder}
          />
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">{translate.commonCancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => void onConfirmAddKey()}>{translate.commonAdd}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteKey)} onOpenChange={(open) => !open && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate.dialogDeleteKeyTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteKey
                ? withParams(translate.dialogDeleteKeyConfirmWithKey, { key: deleteKey })
                : translate.dialogDeleteKeyConfirmGeneric}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">{translate.commonCancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => void onConfirmDeleteKey()}>
                {translate.commonDelete}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate.dialogClearAllTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate.dialogClearAllDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">{translate.commonCancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => void onConfirmReset()}>
                {translate.commonClear}
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
