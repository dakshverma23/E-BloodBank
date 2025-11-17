import { useEffect, useState } from 'react'
import { Card, Form, Input, DatePicker, Button, message, Space, Typography, Tag } from 'antd'
import { EnvironmentOutlined, LoadingOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import dayjs from 'dayjs'
import { getCurrentAddress } from '../utils/geolocation'
import { useTheme } from '../contexts/ThemeContext'

const { Title, Text } = Typography

export default function Profile() {
  const { colors } = useTheme()
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
      message.success('Profile updated successfully')
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
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <Card
        variant="borderless"
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          background: colors.gradient,
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserOutlined style={{ fontSize: '28px', color: colors.primary }} />
          <div>
            <Title level={2} style={{ margin: 0, color: colors.text }}>My Profile</Title>
            <Text type="secondary" style={{ color: colors.textSecondary }}>Manage your profile information</Text>
          </div>
        </div>
      </Card>

      {me ? (
        <>
          {/* Account Information */}
          <Card
            style={{
              marginBottom: '24px',
              borderRadius: '12px',
              boxShadow: `0 2px 8px ${colors.shadow}`,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Title level={4} style={{ marginBottom: '20px', color: colors.text }}>
              Account Information
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {me.external_id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Text type="secondary" style={{ minWidth: '120px' }}>Your ID:</Text>
                  <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>{me.external_id}</Tag>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MailOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <Text type="secondary" style={{ minWidth: '100px', color: colors.textSecondary }}>Email:</Text>
                <Text copyable={{ text: me.email }} style={{ color: colors.text }}>{me.email}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PhoneOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
                <Text type="secondary" style={{ minWidth: '100px', color: colors.textSecondary }}>Phone:</Text>
                <Text style={{ color: colors.text }}>{me.phone || 'Not provided'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                <Text type="secondary" style={{ minWidth: '100px', color: colors.textSecondary }}>Username:</Text>
                <Text strong style={{ color: colors.text }}>{me.username}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text type="secondary" style={{ minWidth: '100px', color: colors.textSecondary }}>User Type:</Text>
                <Tag color={me.user_type === 'bloodbank' ? 'blue' : 'green'} style={{ fontSize: '13px', padding: '4px 12px' }}>
                  {me.user_type === 'bloodbank' ? 'Blood Bank' : 'Donor'}
                </Tag>
              </div>
            </Space>
          </Card>

          {/* Profile Details */}
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: `0 2px 8px ${colors.shadow}`,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Title level={4} style={{ marginBottom: '20px', color: colors.text }}>
              Profile Details
            </Title>
            <Form layout="vertical" form={form} onFinish={onFinish}>
              <Form.Item name="date_of_birth" label="Date of Birth">
                <DatePicker className="w-full" size="large" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item 
                name="address" 
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: '#52c41a' }} />
                    <Text strong>Address</Text>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={loadingLocation ? <LoadingOutlined /> : <EnvironmentOutlined />}
                      onClick={handleUseLocation}
                      loading={loadingLocation}
                      style={{ padding: 0 }}
                    >
                      Use My Location
                    </Button>
                  </Space>
                }
              >
                <Input.TextArea rows={3} placeholder="Your address will be auto-filled when you click 'Use My Location'" size="large" />
              </Form.Item>
              <Form.Item name="city" label="City">
                <Input placeholder="City will be auto-filled from your location" size="large" />
              </Form.Item>
              <Form.Item name="state" label="State">
                <Input placeholder="State will be auto-filled from your location" size="large" />
              </Form.Item>
              <Form.Item name="pincode" label="Pincode">
                <Input placeholder="Pincode will be auto-filled from your location" size="large" />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={saving}
                  size="large"
                  style={{
                    background: colors.gradientButton,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                    padding: '0 24px',
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </Card>
        </>
      ) : (
        <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Text>Loading...</Text>
        </Card>
      )}
    </div>
  )
}
