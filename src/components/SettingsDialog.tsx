import { useState } from 'react'
import { Settings } from 'lucide-react'
import { useTranslationStore } from '../store/useTranslationStore'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'

export function SettingsDialog() {
  const apiKey = useTranslationStore((state) => state.apiKey)
  const setApiKey = useTranslationStore((state) => state.setApiKey)
  const [draft, setDraft] = useState(apiKey)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nustatymai</DialogTitle>
          <DialogDescription>
            OPENAI_API_KEY saugomas tik jūsų naršyklėje localStorage. Niekada neįrašykite rakto į source code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="openai-api-key">
            OPENAI_API_KEY
          </label>
          <Input
            id="openai-api-key"
            type="password"
            placeholder="sk-..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-stone-500">
            <p>Laukas slepiamas password tipu, raktas matomas tik jums lokaliai.</p>
            <span className={`rounded-full px-2 py-1 font-medium ${draft ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
              {draft ? 'Configured' : 'Missing'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDraft(apiKey)}>
            Atšaukti
          </Button>
          <Button onClick={() => setApiKey(draft)}>Išsaugoti</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
