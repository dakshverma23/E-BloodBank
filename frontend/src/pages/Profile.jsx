import { useEffect, useState } from 'react'
import { Card, Form, Input, DatePicker, Button, Upload, message, Space } from 'antd'
import { EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import dayjs from 'dayjs'
import { getCurrentAddress } from '../utils/geolocation'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/api/accounts/me/')
        setMe(data)
        if (data?.profile) {
          setProfile(data.profile)
          form.setFieldsValue({
            date_of_birth: data.profile.date_of_birth ? dayjs(data.profile.date_of_birth) : null,
            address: data.profile.address || '',
            city: data.profile.city || '',
            state: data.profile.state || '',
            pincode: data.profile.pincode || '',
          })
        }
      } catch (e) {
        setMe(null)
      }
    })()
  }, [form])

  async function handleUseLocation() {
    setLoadingLocation(true)
    try {
      const addressData = await getCurrentAddress()
      form.setFieldsValue({
        address: addressData.address || addressData.street || '',
        city: addressData.city || '',
        state: addressData.state || '',
        pincode: addressData.pincode || '',
      })
      message.success('Location detected and address filled!')
    } catch (error) {
      message.error(error.message || 'Failed to get your location. Please allow location access.')
    } finally {
      setLoadingLocation(false)
    }
  }

  async function onFinish(values) {
    if (!profile?.id) return
    setSaving(true)
    try {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
      }
      await api.put(`/api/accounts/profiles/${profile.id}/`, payload)
      message.success('Profile updated')
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        message.error(msgs || 'Failed to update profile')
      } else {
        message.error('Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="My Profile">
      {me ? (
        <div className="space-y-4">
          <div className="space-y-1">
            {me.external_id && <div><b>Your ID:</b> {me.external_id}</div>}
            <div><b>Username:</b> {me.username}</div>
            <div><b>Email:</b> {me.email}</div>
            <div><b>Phone:</b> {me.phone}</div>
            <div><b>User Type:</b> {me.user_type}</div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Profile Details</h2>
            <Form layout="vertical" form={form} onFinish={onFinish}>
              <Form.Item name="date_of_birth" label="Date of Birth">
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item 
                name="address" 
                label={
                  <Space>
                    <span>Address</span>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={loadingLocation ? <LoadingOutlined /> : <EnvironmentOutlined />}
                      onClick={handleUseLocation}
                      loading={loadingLocation}
                    >
                      Use My Location
                    </Button>
                  </Space>
                }
              >
                <Input.TextArea rows={3} placeholder="Your address will be auto-filled when you click 'Use My Location'" />
              </Form.Item>
              <Form.Item name="city" label="City">
                <Input placeholder="City will be auto-filled from your location" />
              </Form.Item>
              <Form.Item name="state" label="State">
                <Input placeholder="State will be auto-filled from your location" />
              </Form.Item>
              <Form.Item name="pincode" label="Pincode">
                <Input placeholder="Pincode will be auto-filled from your location" />
              </Form.Item>
              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
              </div>
            </Form>
          </div>
        </div>
      ) : 'Loading...'}
    </Card>
  )
}


