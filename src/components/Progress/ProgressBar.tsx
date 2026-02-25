import { useMemo } from 'react'
import './ProgressBar.css'

export function ProgressBar({ progress, count }: { progress: number, count: number }) {
  const arr = useMemo(() => Array.from({ length: count }), [count])

  return (
    <div className="progress-bar" style={{ gap: `${count > 15 ? 2 : 9}px` }}>
      {
        arr.map((_v, i) => (<div className={`progress-cell ${(i < progress) ? 'filled' : ''}`} />))
      }
    </div>
  )
}
