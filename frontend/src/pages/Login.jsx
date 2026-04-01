import { useState } from 'react'
import { Button, Card, Form, Input, message } from 'antd'
import { api, setTokens, clearTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import BackendStatus from '../components/BackendStatus'
import { motion } from 'framer-motion'

export default function Login() {
  const [loading, setLoading] = useState(false)
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
      // Network error (backend not reachable)
      if (!e.response) {
        const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
        message.error(`Cannot connect to server. Make sure the backend is running at ${apiBaseURL}`)
        return
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <BackendStatus />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card title={<h2 className="lux-title" style={{ fontSize: '30px', color: 'rgba(255,255,255,.92)', textAlign: 'center' }}>Welcome back</h2>} className="shadow-lg">
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
          <span style={{ color: 'rgba(255,255,255,.70)' }}>No account? </span>
          <Link to="/signup" style={{ color: 'rgba(255,122,24,1)' }}>Signup</Link>
        </div>
      </Card>
      </motion.div>
      </div>
    </div>
  )
}


