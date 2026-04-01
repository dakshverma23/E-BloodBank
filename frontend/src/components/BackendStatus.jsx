import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Alert } from 'antd'

/**
 * Pings /api/health on mount to verify backend is reachable via proxy.
 * Shows status on Login/Signup so users know if backend is running.
 */
export default function BackendStatus() {
  const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'error'

  useEffect(() => {
    let cancelled = false
    api.get('/api/health/')
      .then(() => !cancelled && setStatus('ok'))
      .catch(() => !cancelled && setStatus('error'))
    return () => { cancelled = true }
  }, [])

  if (status === 'checking') return null
  if (status === 'error') {
    return (
      <Alert
        type="error"
        showIcon
        message="Backend not reachable"
        description={
          <>
            Make sure the backend is running: <code>python manage.py runserver</code> in the <code>backend</code> folder.
            <br />
            Then restart the frontend: <code>npm run dev</code> in the <code>frontend</code> folder.
          </>
        }
        style={{ marginBottom: 16 }}
      />
    )
  }
  return (
    <Alert type="success" showIcon message="Backend connected" style={{ marginBottom: 16 }} />
  )
}
