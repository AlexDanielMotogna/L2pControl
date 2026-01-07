import { useState, useEffect } from 'react'

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

function SessionTimer({ startAt }) {
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const startTime = new Date(startAt).getTime()

    const updateDuration = () => {
      const now = Date.now()
      setDuration(Math.floor((now - startTime) / 1000))
    }

    updateDuration()
    const interval = setInterval(updateDuration, 1000)

    return () => clearInterval(interval)
  }, [startAt])

  return (
    <span className="font-mono text-sm text-blue-600 font-medium">
      {formatDuration(duration)}
    </span>
  )
}

export default SessionTimer
export { formatDuration }
