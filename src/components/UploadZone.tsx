import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from './ui/button'

interface UploadZoneProps {
  onFileLoaded: (fileName: string, content: string) => Promise<void>
}

export function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isOver, setIsOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const loadFile = async (file: File | undefined) => {
    if (!file) {
      return
    }

    const content = await file.text()
    await onFileLoaded(file.name, content)
  }

  return (
    <div
      className={`surface-panel border-2 border-dashed p-5 transition ${isOver ? 'border-amber-500 bg-amber-50/70' : 'border-[#dccfb7] bg-white/90'}`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={async (event) => {
        event.preventDefault()
        setIsOver(false)
        await loadFile(event.dataTransfer.files?.[0])
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="application/json"
        onChange={async (event) => {
          await loadFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Upload a translations JSON file</p>
            <p className="text-xs text-stone-600">Drag and drop or choose a file manually.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  )
}
