import { useState, useCallback } from 'react'
import { Button, Card, Form, Input, Select, DatePicker, InputNumber, message, Typography, Space } from 'antd'
import { EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
import { api, setTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentAddress } from '../utils/geolocation'
import BackendStatus from '../components/BackendStatus'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'

const { Text } = Typography

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // Auto-fill address using browser location
  const handleUseLocation = useCallback(async () => {
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
  }, [form])

  async function onFinish(values) {
    // Basic frontend validation for email and phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(values.email?.trim())) {
      message.error('Please enter a valid email address')
      return
    }

    const phoneDigits = (values.phone || '').replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      message.error('Please enter a valid 10-digit phone number')
      return
    }

    const finalEmail = values.email?.trim()
    const finalPhone = phoneDigits
    values.email = finalEmail
    values.phone = finalPhone

    // Prepare payload
    const payload = { ...values }

    // Format date_of_birth if provided
    if (payload.date_of_birth && dayjs.isDayjs(payload.date_of_birth)) {
      payload.date_of_birth = payload.date_of_birth.format('YYYY-MM-DD')
    }

    // Normalize emergency contact if present
    if (payload.emergency_contact) {
      payload.emergency_contact = payload.emergency_contact.replace(/\D/g, '')
    }

    // Tell backend that OTP is effectively skipped
    payload.otp_verified = true

    setLoading(true)
    try {
      console.log('Attempting signup at: /api/accounts/signup/')
      
      const { data } = await api.post('/api/accounts/signup/', payload)
      if (data?.access && data?.refresh) {
        setTokens({ access: data.access, refresh: data.refresh })
      }

      message.success('Account created successfully!')
      navigate('/')
    } catch (e) {
      console.error('Signup error:', e)
      console.error('Error details:', {
        message: e.message,
        code: e.code,
        response: e.response,
        config: e.config
      })
      
      // Network error (backend not reachable)
      if (!e.response) {
        const errorMsg = e.message || 'Network error'
        const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        message.error(`Cannot connect to server: ${errorMsg}. Make sure the backend is running at ${apiBaseURL}`)
        return
      }
      
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        message.error(msgs || 'Signup failed')

        const fieldErrors = Object.entries(resp).map(([name, val]) => ({
          name,
          errors: [Array.isArray(val) ? val.join(', ') : String(val)],
        }))
        if (fieldErrors.length) {
          form.setFields(fieldErrors)
        }
      } else {
        // Show raw error text to help debug signup failures
        const raw = typeof resp === 'string' ? resp : e?.message
        message.error(raw || `Signup failed: ${e.response?.status} ${e.response?.statusText || ''}`)
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
        <Card
          title={
            <h2 className="lux-title" style={{ fontSize: '30px', color: 'rgba(255,255,255,.92)', textAlign: 'center' }}>
              Create your account
            </h2>
          }
          className="shadow-lg"
        >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' },
              { len: 10, message: 'Phone number must be exactly 10 digits' },
            ]}
          >
            <Input
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                form.setFieldsValue({ phone: value })
              }}
            />
          </Form.Item>

          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter a username' }]}>
            <Input placeholder="Enter username" />
          </Form.Item>

          {/* Donor extra fields */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.user_type !== cur.user_type}>
            {({ getFieldValue }) =>
              getFieldValue('user_type') === 'donor' ? (
                <>
                  <Form.Item
                    name="full_name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                  >
                    <Input placeholder="Enter your full name" />
                  </Form.Item>
                  <Form.Item
                    name="blood_group"
                    label="Blood Group"
                    rules={[{ required: true, message: 'Please select your blood group' }]}
                  >
                    <Select
                      placeholder="Select blood group"
                      options={[
                        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                        { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                        { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="date_of_birth"
                    label="Date of Birth"
                    rules={[{ required: true, message: 'Please select your date of birth' }]}
                  >
                    <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Select date of birth" />
                  </Form.Item>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true, message: 'Please select your gender' }]}
                  >
                    <Select
                      placeholder="Select gender"
                      options={[
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' },
                        { value: 'O', label: 'Other' },
                      ]}
                    />
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
                    rules={[{ required: true, message: 'Please enter your address' }]}
                  >
                    <Input.TextArea rows={2} placeholder="Address will be auto-filled from your location" />
                  </Form.Item>
                  <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please enter your city' }]}>
                    <Input placeholder="City will be auto-filled from your location" />
                  </Form.Item>
                  <Form.Item name="state" label="State" rules={[{ required: true, message: 'Please enter your state' }]}>
                    <Input placeholder="State will be auto-filled from your location" />
                  </Form.Item>
                  <Form.Item
                    name="pincode"
                    label="Pincode"
                    rules={[{ required: true, message: 'Please enter your pincode' }]}
                  >
                    <Input placeholder="Pincode will be auto-filled from your location" maxLength={10} />
                  </Form.Item>
                  <Form.Item
                    name="weight"
                    label="Weight (kg)"
                    rules={[{ required: true, message: 'Please enter your weight' }]}
                  >
                    <InputNumber
                      className="w-full"
                      min={1}
                      max={300}
                      step={0.1}
                      placeholder="Enter weight in kg"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="emergency_contact"
                    label="Emergency Contact"
                    rules={[
                      { required: true, message: 'Please enter emergency contact' },
                      { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' },
                      { len: 10, message: 'Phone number must be exactly 10 digits' },
                    ]}
                  >
                    <Input
                      placeholder="Enter 10-digit emergency contact number"
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        form.setFieldsValue({ emergency_contact: value })
                      }}
                    />
                  </Form.Item>
                  <Form.Item name="medical_conditions" label="Medical Conditions (optional)">
                    <Input.TextArea rows={2} placeholder="Enter any medical conditions (optional)" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          {/* Blood bank extra fields */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.user_type !== cur.user_type}>
            {({ getFieldValue }) =>
              getFieldValue('user_type') === 'bloodbank' ? (
                <>
                  <Form.Item name="bb_name" label="Blood Bank Name">
                    <Input placeholder="Enter blood bank name" />
                  </Form.Item>
                  <Form.Item name="bb_registration_number" label="Registration Number">
                    <Input placeholder="Enter registration number" />
                  </Form.Item>
                  <Form.Item name="bb_address" label="Address">
                    <Input placeholder="Enter address" />
                  </Form.Item>
                  <Form.Item name="bb_city" label="City">
                    <Input placeholder="Enter city" />
                  </Form.Item>
                  <Form.Item name="bb_state" label="State">
                    <Input placeholder="Enter state" />
                  </Form.Item>
                  <Form.Item name="bb_pincode" label="Pincode">
                    <Input placeholder="Enter pincode" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item name="user_type" label="User Type" rules={[{ required: true, message: 'Please select user type' }]}>
            <Select
              placeholder="Select user type"
              options={[
                { value: 'donor', label: 'Donor/Receiver' },
                { value: 'bloodbank', label: 'Blood Bank' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
          >
            Create account
          </Button>
        </Form>
        <div className="mt-4 text-center">
          <Text style={{ color: 'rgba(255,255,255,.70)' }}>Have an account? </Text>
          <Link to="/login" style={{ color: 'rgba(255,122,24,1)' }}>Login</Link>
        </div>
      </Card>
      </motion.div>
      </div>
    </div>
  )
}

