import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Form, Input, Select, DatePicker, InputNumber, message, Typography, Divider, Space } from 'antd'
import { EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
import { api, setTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentAddress } from '../utils/geolocation'
import dayjs from 'dayjs'

const { Text } = Typography

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState(null)
  const [verifiedName, setVerifiedName] = useState(null)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // Handle Google Sign In
  const handleGoogleSignIn = useCallback(async (response) => {
    try {
      const { data } = await api.post('/api/accounts/google/verify/', {
        token: response.credential
      })
      
      if (data.email) {
        setEmailVerified(true)
        setVerifiedEmail(data.email)
        setVerifiedName(data.name)
        
        // Auto-fill form fields from Google account
        const formValues = {
          email: data.email,
        }
        
        // Auto-fill username from Google name (remove spaces, lowercase)
        if (data.name) {
          const usernameFromName = data.name.toLowerCase().replace(/\s+/g, '')
          formValues.username = usernameFromName
        }
        
        // Auto-fill full_name from Google name for new users
        if (data.name) {
          formValues.full_name = data.name
        }
        
        // Check if user already exists and pre-fill their data if found
        try {
          const { data: userData } = await api.post('/api/accounts/search-by-email/', { email: data.email })
          // User exists - pre-fill their data
          if (userData) {
            if (userData.username) {
              formValues.username = userData.username
            }
            if (userData.donor) {
              // Pre-fill donor profile fields from existing profile
              if (userData.donor.full_name) {
                formValues.full_name = userData.donor.full_name
              }
              if (userData.donor.blood_group) {
                formValues.blood_group = userData.donor.blood_group
              }
              if (userData.donor.date_of_birth) {
                formValues.date_of_birth = dayjs(userData.donor.date_of_birth)
              }
              if (userData.donor.gender) {
                formValues.gender = userData.donor.gender
              }
              if (userData.donor.address) {
                formValues.address = userData.donor.address
              }
              if (userData.donor.city) {
                formValues.city = userData.donor.city
              }
              if (userData.donor.state) {
                formValues.state = userData.donor.state
              }
              if (userData.donor.pincode) {
                formValues.pincode = userData.donor.pincode
              }
              if (userData.donor.weight) {
                formValues.weight = userData.donor.weight
              }
              if (userData.donor.emergency_contact) {
                formValues.emergency_contact = userData.donor.emergency_contact
              }
              if (userData.donor.medical_conditions) {
                formValues.medical_conditions = userData.donor.medical_conditions
              }
            }
            if (userData.profile) {
              // Pre-fill user profile fields if donor profile doesn't have them
              if (!formValues.address && userData.profile.address) {
                formValues.address = userData.profile.address
              }
              if (!formValues.city && userData.profile.city) {
                formValues.city = userData.profile.city
              }
              if (!formValues.state && userData.profile.state) {
                formValues.state = userData.profile.state
              }
              if (!formValues.pincode && userData.profile.pincode) {
                formValues.pincode = userData.profile.pincode
              }
              if (!formValues.date_of_birth && userData.profile.date_of_birth) {
                formValues.date_of_birth = dayjs(userData.profile.date_of_birth)
              }
            }
            message.info('Found existing profile. Fields pre-filled. You can update them if needed.')
          }
        } catch (e) {
          // User doesn't exist yet - that's fine, continue with Google data
          // FormValues already has email, username, and full_name from Google
        }
        
        form.setFieldsValue(formValues)
        message.success('Email verified successfully via Google!')
      }
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const errorMsg = resp.error || Object.values(resp).flat().join(', ')
        // Handle different error cases
        if (errorMsg.includes('already registered') || resp.warning) {
          message.warning('This email is already registered. Please login instead.')
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else if (!errorMsg.includes('not found')) {
          // Only show error if it's not a "not found" error (which is expected for new users)
          message.error(errorMsg || 'Failed to verify Google account')
        }
        // If user not found, that's fine - continue with Google data
      } else {
        message.error('Failed to verify Google account. Please try again.')
      }
    }
  }, [form, navigate])

  // Load Google OAuth script
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    
    if (!googleClientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set in environment variables')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google?.accounts?.id) {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn,
        })
        
        // Render the Google Sign-In button
        const buttonContainer = document.getElementById('google-signin-button')
        if (buttonContainer) {
          window.google.accounts.id.renderButton(
            buttonContainer,
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
              type: 'standard',
            }
          )
        }
      }
    }
    
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [handleGoogleSignIn])

  // Handle location auto-fill
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
    // Check if email is verified
    if (!emailVerified) {
      message.error('Please verify your email using Google Sign-In first')
      return
    }

    // Verify email matches
    if (values.email !== verifiedEmail) {
      message.error('Email does not match verified Google account')
      return
    }
    
    // Update phone value in form to normalized format for database
    values.phone = values.phone.replace(/\D/g, '')
    
    // Prepare payload with formatted dates
    const payload = { ...values }
    
    // Format date_of_birth if provided (Dayjs object)
    if (payload.date_of_birth && dayjs.isDayjs(payload.date_of_birth)) {
      payload.date_of_birth = payload.date_of_birth.format('YYYY-MM-DD')
    }
    
    // Format emergency_contact phone if provided
    if (payload.emergency_contact) {
      payload.emergency_contact = payload.emergency_contact.replace(/\D/g, '')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/api/accounts/signup/', payload)
      if (data?.access && data?.refresh) {
        setTokens({ access: data.access, refresh: data.refresh })
      }
      message.success('Account created successfully!')
      navigate('/')
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        message.error(msgs || 'Signup failed')
        
        // Set form field errors
        const fieldErrors = Object.entries(resp).map(([name, val]) => ({
          name,
          errors: [Array.isArray(val) ? val.join(', ') : String(val)],
        }))
        form.setFields(fieldErrors)
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
        {/* Google Sign In Section */}
        <div style={{ marginBottom: '24px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px' }}>Step 1: Verify Your Email with Google</Text>
          {!emailVerified ? (
            <>
              <div id="google-signin-button" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', minHeight: '40px' }}></div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', textAlign: 'center' }}>
                Click the button above to verify your email address using Google
              </Text>
              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <Text type="danger" style={{ fontSize: '12px', display: 'block', textAlign: 'center', marginTop: '8px' }}>
                  Warning: Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
                </Text>
              )}
            </>
          ) : (
            <div style={{ padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <Text type="success" strong>✓ Email Verified!</Text>
              <div style={{ marginTop: '8px' }}>
                <Text>Email: {verifiedEmail}</Text>
                {verifiedName && <Text style={{ display: 'block' }}>Name: {verifiedName}</Text>}
              </div>
            </div>
          )}
        </div>

        <Divider>Then Complete Your Profile</Divider>

        {/* Signup Form */}
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Enter username" />
          </Form.Item>
          
          <Form.Item 
            name="email" 
            label="Email" 
            rules={[
              { required: true, type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input 
              placeholder="Enter email (must match verified Google account)" 
              disabled={emailVerified}
            />
          </Form.Item>
          
          {emailVerified && (
            <Text type="success" style={{ fontSize: '12px', display: 'block', marginBottom: '16px' }}>
              ✓ This email is verified via Google
            </Text>
          )}

          <Form.Item 
            name="phone" 
            label="Phone Number" 
            rules={[
              { required: true, pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' },
              { len: 10, message: 'Phone number must be exactly 10 digits' }
            ]}
          >
            <Input 
              placeholder="Enter 10-digit phone number" 
              maxLength={10}
              onChange={(e) => {
                // Only allow digits
                const value = e.target.value.replace(/\D/g, '')
                form.setFieldsValue({ phone: value })
              }}
            />
          </Form.Item>
          
          <Form.Item name="user_type" label="User Type" rules={[{ required: true }]}>
            <Select placeholder="Select user type" options={[
              { value: 'donor', label: 'Donor/Receiver' },
              { value: 'bloodbank', label: 'Blood Bank' },
              { value: 'admin', label: 'Admin' },
            ]} />
          </Form.Item>
          
          {/* Donor extra fields */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.user_type !== cur.user_type}>
            {({ getFieldValue }) => getFieldValue('user_type') === 'donor' ? (
              <>
                <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: 'Please enter your full name' }]}> 
                  <Input placeholder="Enter your full name"/> 
                </Form.Item>
                <Form.Item name="blood_group" label="Blood Group" rules={[{ required: true, message: 'Please select your blood group' }]}> 
                  <Select placeholder="Select blood group" options={[
                    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                  ]} /> 
                </Form.Item>
                <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true, message: 'Please select your date of birth' }]}> 
                  <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Select date of birth" /> 
                </Form.Item>
                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Please select your gender' }]}> 
                  <Select placeholder="Select gender" options={[
                    { value: 'M', label: 'Male' },
                    { value: 'F', label: 'Female' },
                    { value: 'O', label: 'Other' },
                  ]} /> 
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
                  <Input.TextArea rows={2} placeholder="Address will be auto-filled from your location"/> 
                </Form.Item>
                <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please enter your city' }]}> 
                  <Input placeholder="City will be auto-filled from your location"/> 
                </Form.Item>
                <Form.Item name="state" label="State" rules={[{ required: true, message: 'Please enter your state' }]}> 
                  <Input placeholder="State will be auto-filled from your location"/> 
                </Form.Item>
                <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: 'Please enter your pincode' }]}> 
                  <Input placeholder="Pincode will be auto-filled from your location" maxLength={10}/> 
                </Form.Item>
                <Form.Item name="weight" label="Weight (kg)" rules={[{ required: true, message: 'Please enter your weight' }]}> 
                  <InputNumber className="w-full" min={1} max={300} step={0.1} placeholder="Enter weight in kg" style={{ width: '100%' }} /> 
                </Form.Item>
                <Form.Item 
                  name="emergency_contact" 
                  label="Emergency Contact" 
                  rules={[
                    { required: true, message: 'Please enter emergency contact' },
                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' },
                    { len: 10, message: 'Phone number must be exactly 10 digits' }
                  ]}
                > 
                  <Input 
                    placeholder="Enter 10-digit emergency contact number" 
                    maxLength={10}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '')
                      form.setFieldsValue({ emergency_contact: value })
                    }}
                  /> 
                </Form.Item>
                <Form.Item name="medical_conditions" label="Medical Conditions (optional)"> 
                  <Input.TextArea rows={2} placeholder="Enter any medical conditions (optional)"/> 
                </Form.Item>
              </>
            ) : null}
          </Form.Item>
          
          {/* Blood bank extra fields */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.user_type !== cur.user_type}>
            {({ getFieldValue }) => getFieldValue('user_type') === 'bloodbank' ? (
              <>
                <Form.Item name="bb_name" label="Blood Bank Name"> 
                  <Input placeholder="Enter blood bank name"/> 
                </Form.Item>
                <Form.Item name="bb_registration_number" label="Registration Number"> 
                  <Input placeholder="Enter registration number"/> 
                </Form.Item>
                <Form.Item name="bb_address" label="Address"> 
                  <Input placeholder="Enter address"/> 
                </Form.Item>
                <Form.Item name="bb_city" label="City"> 
                  <Input placeholder="Enter city"/> 
                </Form.Item>
                <Form.Item name="bb_state" label="State"> 
                  <Input placeholder="Enter state"/> 
                </Form.Item>
                <Form.Item name="bb_pincode" label="Pincode"> 
                  <Input placeholder="Enter pincode"/> 
                </Form.Item>
              </>
            ) : null}
          </Form.Item>
          
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}>
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading} 
            disabled={!emailVerified}
          >
            Create account
          </Button>
          
          {!emailVerified && (
            <Text type="warning" style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
              Please verify your email using Google Sign-In first.
            </Text>
          )}
        </Form>
        <div className="mt-4 text-center">
          Have an account? <Link to="/login">Login</Link>
        </div>
      </Card>
    </div>
  )
}
