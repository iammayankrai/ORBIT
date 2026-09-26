import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, FileSpreadsheet, UploadCloud } from 'lucide-react'
import Button from '../ui/Button.jsx'
import ProcessingSequence from './ProcessingSequence.jsx'
import { analyzeDataset } from '../../services/dataService.js'

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']
const MAX_SIZE_BYTES = 8 * 1024 * 1024

function isAcceptedFile(file) {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

// The main visual focus of the homepage: drop a file (or try the sample),
// watch it get analysed, then hand the result up to the parent, which swaps
// in the results section. Kept dumb about what happens after onAnalyzed —
// this component only owns getting from "no data" to "analysed data".
export default function UploadPanel({ onAnalyzed }) {
  const [status, setStatus] = useState('idle') // idle | processing | error
  const [error, setError] = useState('')
  const [activeLabel, setActiveLabel] = useState('')
  const [animationDone, setAnimationDone] = useState(false)
  const [apiResult, setApiResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (status !== 'processing' || !animationDone || !apiResult) return
    if (apiResult.ok) {
      onAnalyzed(apiResult.datasetSource, apiResult.result)
      // The result now lives in the parent (and renders in the results
      // section) — reset so this panel is immediately ready for another
      // upload rather than sitting frozen on a "done" checklist forever.
      setStatus('idle')
      setApiResult(null)
      setAnimationDone(false)
    } else {
      setError(apiResult.message)
      setStatus('error')
    }
  }, [status, animationDone, apiResult, onAnalyzed])

  function beginAnalysis(datasetSource, label) {
    setError('')
    setAnimationDone(false)
    setApiResult(null)
    setActiveLabel(label)
    setStatus('processing')
    analyzeDataset(datasetSource)
      .then((result) => setApiResult({ ok: true, datasetSource, result }))
      .catch((err) => setApiResult({ ok: false, message: err.message || 'Something went wrong. Please try again.' }))
  }

  function handleFiles(fileList) {
    const file = fileList?.[0]
    if (!file) return
    if (!isAcceptedFile(file)) {
      setError('Please upload a .csv, .xlsx or .xls file.')
      setStatus('error')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('That file is larger than the 8MB limit for this demo.')
      setStatus('error')
      return
    }
    beginAnalysis({ file }, file.name)
  }

  function handleSample() {
    beginAnalysis({ useSample: true }, 'Sales_Data_Demo.xlsx')
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div id="upload" className="w-full max-w-xl scroll-mt-24">
      {status === 'processing' ? (
        <div className="flex flex-col items-center gap-5 rounded-[28px] border border-border bg-white px-8 py-9 text-center shadow-card-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
            <FileSpreadsheet size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[17px] font-semibold text-ink">Analysing {activeLabel}</p>
            <p className="mt-1 text-sm text-ink-faint">This usually takes a few seconds.</p>
          </div>
          <ProcessingSequence onDone={() => setAnimationDone(true)} />
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload your Excel or CSV file"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          className={`group flex cursor-pointer flex-col items-center gap-3 rounded-[28px] border-2 border-dashed px-8 py-9 text-center shadow-card-lg transition-colors duration-200 ${
            dragActive ? 'border-accent bg-accent-soft/60' : 'border-border bg-white hover:border-accent/40 hover:bg-surface-alt/60'
          }`}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark transition-transform duration-200 group-hover:scale-105">
            <UploadCloud size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[17px] font-semibold text-ink">Upload Your Data</p>
            <p className="mt-1 text-sm text-ink-faint">Drag &amp; drop your Excel or CSV file, or click to browse</p>
          </div>

          {status === 'error' && (
            <div
              className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm text-red-700"
              onClick={(e) => e.stopPropagation()}
              role="alert"
            >
              <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        <Button as="button" type="button" variant="secondary" size="md" onClick={handleSample} disabled={status === 'processing'}>
          Try Sample Data
        </Button>
        <p className="text-sm text-ink-faint">Excel • CSV&nbsp;&nbsp;|&nbsp;&nbsp;Free Demo</p>
      </div>
    </div>
  )
}
