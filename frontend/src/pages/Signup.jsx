import { useState } from 'react'
import { Button, Card, Form, Input, Select, message } from 'antd'
import { api, setTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function onFinish(values) {
    setLoading(true)
    try {
      const { data } = await api.post('/api/accounts/signup/', values)
      if (data?.access && data?.refresh) {
        setTokens({ access: data.access, refresh: data.refresh })
      }
      message.success('Account created')
      navigate('/')
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        message.error(msgs || 'Signup failed')
      } else {
        message.error('Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #f0f2f5, #ffffff)' }}>
      <Card title={<h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', textAlign: 'center' }}>Signup for e-BloodBank</h2>} className="w-full max-w-md shadow-lg">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="user_type" label="User Type" rules={[{ required: true }]}>
            <Select options={[
              { value: 'donor', label: 'Donor/Receiver' },
              { value: 'bloodbank', label: 'Blood Bank' },
              { value: 'admin', label: 'Admin' },
            ]} />
          </Form.Item>
          {/* Blood bank extra fields */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.user_type !== cur.user_type}>
            {({ getFieldValue }) => getFieldValue('user_type') === 'bloodbank' ? (
              <>
                <Form.Item name="bb_name" label="Blood Bank Name"> <Input/> </Form.Item>
                <Form.Item name="bb_registration_number" label="Registration Number"> <Input/> </Form.Item>
                <Form.Item name="bb_address" label="Address"> <Input/> </Form.Item>
                <Form.Item name="bb_city" label="City"> <Input/> </Form.Item>
                <Form.Item name="bb_state" label="State"> <Input/> </Form.Item>
                <Form.Item name="bb_pincode" label="Pincode"> <Input/> </Form.Item>

              </>
            ) : null}
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>Create account</Button>
        </Form>
        <div className="mt-4 text-center">
          Have an account? <Link to="/login">Login</Link>
        </div>
      </Card>
    </div>
  )
}


