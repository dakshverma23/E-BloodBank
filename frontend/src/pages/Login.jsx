import { useState, useCallback } from 'react'
import { Button, Card, Form, Input, message, Divider } from 'antd'
import { api, setTokens, clearTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { auth, googleProvider } from '../firebase/config'
import { signInWithPopup, signOut } from 'firebase/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [signingInWithGoogle, setSigningInWithGoogle] = useState(false)
  const navigate = useNavigate()

  async function onFinish(values) {
    setLoading(true)
    try {
      // Ensure no stale token interferes
      clearTokens()
      const { data } = await api.post('/api/auth/token/by-username-or-email/', values)
      setTokens({ access: data.access, refresh: data.refresh })
      // fetch current user and route by role
      const meResp = await api.get('/api/accounts/me/')
      const role = meResp?.data?.user_type
      message.success('Logged in')
      navigate(role === 'bloodbank' ? '/dashboard/bloodbank' : '/dashboard/donor', { replace: true })
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        message.error(msgs || 'Login failed')
      } else {
        message.error('Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Google Sign-in
  const handleGoogleAuth = useCallback(async () => {
    if (!auth) {
      message.error('Firebase is not configured. Please contact support.')
      return
    }
    
    if (!googleProvider) {
      message.error('Google authentication is not available. Please use username/password login.')
      return
    }

    setSigningInWithGoogle(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const token = await user.getIdToken()
      const email = user.email
      const name = user.displayName || user.email?.split('@')[0] || 'User'
      
      clearTokens()
      
      // Try to login with backend using email or username
      try {
        const loginPayload = {
          username: email?.split('@')[0] || name.toLowerCase().replace(/\s+/g, ''),
          firebase_token: token,
        }
        
        const { data } = await api.post('/api/auth/token/by-username-or-email/', loginPayload)
        if (data?.access && data?.refresh) {
          setTokens({ access: data.access, refresh: data.refresh })
        }
        message.success('Logged in with Google!')
        
        // Fetch user role and navigate
        const meResp = await api.get('/api/accounts/me/')
        const role = meResp?.data?.user_type
        navigate(role === 'bloodbank' ? '/dashboard/bloodbank' : '/dashboard/donor', { replace: true })
      } catch (loginError) {
        message.error('Account not found. Please sign up first.')
        console.error('Google login error:', loginError)
      }
      
      // Sign out from Firebase after backend authentication
      if (auth.currentUser) {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Google sign-in error:', error)
      if (error.code === 'auth/popup-closed-by-user') {
        message.info('Sign-in popup was closed')
      } else {
        message.error('Failed to sign in with Google. Please try again.')
      }
    } finally {
      setSigningInWithGoogle(false)
    }
  }, [auth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #f0f2f5, #ffffff)' }}>
      <Card title={<h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', textAlign: 'center' }}>Login to e-BloodBank</h2>} className="w-full max-w-md shadow-lg">
        {/* Google Sign-in Button */}
        {auth && googleProvider && (
          <div style={{ marginBottom: '24px' }}>
            <Button
              type="default"
              block
              size="large"
              loading={signingInWithGoogle}
              onClick={handleGoogleAuth}
              style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderColor: '#4285f4',
                color: '#4285f4',
                fontWeight: '500'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <Divider>OR</Divider>
          </div>
        )}
        
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}> 
            <Input placeholder="Username" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}> 
            <Input.Password placeholder="Password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ background: '#dc2626', borderColor: '#dc2626' }}>
            Login
          </Button>
        </Form>
        <div className="mt-4 text-center">
          No account? <Link to="/signup" style={{ color: '#dc2626' }}>Signup</Link>
        </div>
      </Card>
    </div>
  )
}


