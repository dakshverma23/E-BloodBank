import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Button, message } from 'antd'
import { api } from '../api/client'

export default function BloodBankEdit() {
  const [bank, setBank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // fetch all banks then pick mine by filtering id from /me or by first record tied to user via my_inventory shortcut
        const me = await api.get('/api/accounts/me/')
        const banks = await api.get('/api/bloodbank/bloodbanks/')
        const list = banks.data.results || banks.data || []
        let mine = null
        if (me?.data?.user_type === 'bloodbank') {
          // try find where name/registration matches; ideally backend would expose a /mine endpoint
          mine = list.find(b => b.user === me.data.id || b.email === me.data.email || b.phone === me.data.phone) || list.find(() => false)
        }
        // Fallback: try to infer from my_inventory call (ensures record exists)
        if (!mine) {
          try { await api.get('/api/bloodbank/bloodbanks/my_inventory/') } catch (_) {}
          const next = await api.get('/api/bloodbank/bloodbanks/')
          const lst2 = next.data.results || next.data || []
          mine = lst2[0] || null
        }
        if (mounted) {
          setBank(mine)
          if (mine) {
            form.setFieldsValue({
              name: mine.name || '',
              registration_number: mine.registration_number || '',
              email: mine.email || '',
              phone: mine.phone || '',
              address: mine.address || '',
              city: mine.city || '',
              state: mine.state || '',
              pincode: mine.pincode || '',
              operating_hours: mine.operating_hours || '',
              latitude: mine.latitude,
              longitude: mine.longitude,
            })
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [form])

  async function onFinish(values) {
    if (!bank?.id) return
    setSaving(true)
    try {
      await api.put(`/api/bloodbank/bloodbanks/${bank.id}/`, values)
      message.success('Blood bank updated')
    } catch {
      message.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Edit Blood Bank" loading={loading}>
      {!bank ? (
        <div>No blood bank found for your account.</div>
      ) : (
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input/> </Form.Item>
          <Form.Item name="registration_number" label="Registration Number" rules={[{ required: true }]}> <Input/> </Form.Item>
          <Form.Item name="email" label="Email"> <Input/> </Form.Item>
          <Form.Item name="phone" label="Phone"> <Input/> </Form.Item>
          <Form.Item name="address" label="Address"> <Input.TextArea rows={2}/> </Form.Item>
          <Form.Item name="city" label="City"> <Input/> </Form.Item>
          <Form.Item name="state" label="State"> <Input/> </Form.Item>
          <Form.Item name="pincode" label="Pincode"> <Input/> </Form.Item>
          <Form.Item name="operating_hours" label="Operating Hours"> <Input/> </Form.Item>
          <Form.Item name="latitude" label="Latitude"> <InputNumber className="w-full" step={0.000001}/> </Form.Item>
          <Form.Item name="longitude" label="Longitude"> <InputNumber className="w-full" step={0.000001}/> </Form.Item>
          <div className="flex justify-end"><Button type="primary" htmlType="submit" loading={saving}>Save</Button></div>
        </Form>
      )}
    </Card>
  )
}


