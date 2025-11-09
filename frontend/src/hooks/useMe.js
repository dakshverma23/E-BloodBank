import { useEffect, useState } from 'react'
import { api, isAuthenticated } from '../api/client'

export default function useMe() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let mounted = true
    
    // Only fetch if authenticated
    if (!isAuthenticated()) {
      if (mounted) {
        setMe(null)
        setLoading(false)
      }
      return
    }
    
    api.get('/api/accounts/me/')
      .then(({ data }) => { 
        if (mounted) setMe(data) 
      })
      .catch(() => { 
        if (mounted) setMe(null) 
      })
      .finally(() => { 
        if (mounted) setLoading(false) 
      })
    
    return () => { mounted = false }
  }, [])
  
  return { me, loading }
}


