import { useState } from 'react'
import { Button, Card, Form, Input, message } from 'antd'
import { api, setTokens, clearTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #f0f2f5, #ffffff)' }}>
      <Card title={<h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', textAlign: 'center' }}>Login to e-BloodBank</h2>} className="w-full max-w-md shadow-lg">
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


