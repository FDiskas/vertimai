import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { useUiI18n } from '../i18n/ui'
import { useTranslationStore } from '../store/useTranslationStore'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'

export function SettingsDialog() {
  const { t } = useUiI18n()
  const apiKey = useTranslationStore((state) => state.apiKey)
  const setApiKey = useTranslationStore((state) => state.setApiKey)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(apiKey)

  useEffect(() => {
    setDraft(apiKey)
  }, [apiKey])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          {t('common.settings')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.settings')}</DialogTitle>
          <DialogDescription>
            {t('settings.apiKeyDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="openai-api-key">
            {t('settings.apiKeyLabel')}
          </label>
          <Input
            id="openai-api-key"
            type="password"
            placeholder="sk-..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-stone-500">
            <p>{t('settings.hiddenHint')}</p>
            <span className={`rounded-full px-2 py-1 font-medium ${draft ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
              {draft ? t('settings.configured') : t('settings.missing')}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setApiKey('')
              setDraft('')
              setOpen(false)
            }}
          >
            {t('common.clear')}
          </Button>
          <Button
            onClick={() => {
              setApiKey(draft.trim())
              setOpen(false)
            }}
          >
            {t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
