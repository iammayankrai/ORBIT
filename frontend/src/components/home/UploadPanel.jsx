import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, UploadCloud } from 'lucide-react'
import { useDataset } from '../../state/DatasetContext.jsx'

const ACCEPTED = ['.csv', '.xlsx', '.xls']
const MAX_SIZE = 8 * 1024 * 1024

// Drop a file -> kick off the analysis -> jump straight into the dashboard
// workspace, which shows its own progress. Only client-side validation lives
// here; server errors are shown by the workspace.
export default function UploadPanel({ className = '', id }) {
  const { loadFile } = useDataset()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')

  function handleFiles(list) {
    const file = list?.[0]
    if (!file) return
    if (!ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError('Please choose a .csv, .xlsx or .xls file.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('That file is larger than the 8 MB limit for this demo.')
      return
    }
    setError('')
    loadFile(file)
    navigate('/dashboard')
  }

  return (
    <div id={id} className={`scroll-mt-28 ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an Excel or CSV file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`group flex cursor-pointer flex-col items-center gap-3 rounded-[28px] border-2 border-dashed px-8 py-9 text-center transition-all duration-200 ${drag ? 'border-accent bg-accent-soft' : 'border-line-strong bg-card/70 hover:border-accent/60 hover:bg-card'}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark transition-transform group-hover:scale-105">
          <UploadCloud size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[17px] font-semibold text-ink">Drop an Excel or CSV here</p>
          <p className="mt-1 text-[13.5px] text-ink-faint">or click to browse · .xlsx .xls .csv · up to 8 MB</p>
        </div>
        {error && (
          <p className="flex items-center gap-2 rounded-full bg-negative/10 px-4 py-1.5 text-[13px] text-negative" role="alert" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={14} aria-hidden="true" /> {error}
          </p>
        )}
      </div>
    </div>
  )
}
