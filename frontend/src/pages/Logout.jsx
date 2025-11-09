import { useEffect } from 'react'
import { clearTokens } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Logout() {
  const navigate = useNavigate()
  useEffect(() => {
    clearTokens()
    navigate('/login', { replace: true })
  }, [navigate])
  return null
}


