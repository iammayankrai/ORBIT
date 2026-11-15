import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { analyzeDataset } from '../services/dataService.js'
import { buildCube } from '../lib/cube.js'

const DatasetContext = createContext(null)

const EMPTY = { status: 'idle', analysis: null, cube: null, source: null, label: '', error: '' }

// Holds the one dataset the visitor is currently looking at - whether it is
// a bundled demo or a file they uploaded - plus the in-browser cube built
// from it. Uploaded files never leave this tab except for the analysis call.
export function DatasetProvider({ children }) {
  const [state, setState] = useState(EMPTY)
  const requestId = useRef(0)

  const inflight = useRef(null)

  const load = useCallback((source, label) => {
    // A second request for the very same dataset while one is running (React
    // StrictMode's double effect, a double click) shares the first.
    const key = source.useSample ? `s:${source.sampleId}` : `f:${source.file.name}:${source.file.size}:${source.file.lastModified}`
    if (inflight.current?.key === key) return inflight.current.promise

    const id = ++requestId.current
    setState({ ...EMPTY, status: 'loading', label, source })
    const promise = (async () => {
      try {
        const analysis = await analyzeDataset(source)
        if (id !== requestId.current) return null
        if (!analysis?.dataset) {
          throw new Error('The analysis server is being updated. Please try again in a minute.')
        }
        const cube = buildCube(analysis.dataset)
        setState({ status: 'ready', analysis, cube, source, label: analysis.dataset_name, error: '' })
        return analysis
      } catch (err) {
        if (id !== requestId.current) return null
        setState({ ...EMPTY, status: 'error', label, source, error: err.message || 'Something went wrong. Please try again.' })
        return null
      } finally {
        if (inflight.current?.key === key) inflight.current = null
      }
    })()
    inflight.current = { key, promise }
    return promise
  }, [])

  const loadSample = useCallback((sampleId, label) => load({ useSample: true, sampleId }, label ?? sampleId), [load])
  const loadFile = useCallback((file) => load({ file }, file.name), [load])
  const reset = useCallback(() => {
    requestId.current++
    inflight.current = null
    setState(EMPTY)
  }, [])

  const value = useMemo(() => ({ ...state, loadSample, loadFile, reset }), [state, loadSample, loadFile, reset])
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export const useDataset = () => useContext(DatasetContext)
