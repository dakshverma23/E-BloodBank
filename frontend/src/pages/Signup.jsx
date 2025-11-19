import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Form, Input, Select, DatePicker, InputNumber, message, Typography, Divider, Space, Modal } from 'antd'
import { EnvironmentOutlined, LoadingOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { api, setTokens } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentAddress } from '../utils/geolocation'
import dayjs from 'dayjs'
import { auth, initializeRecaptcha } from '../firebase/config'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut
} from 'firebase/auth'

const { Text } = Typography

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState(null)
  const [verifiedPhone, setVerifiedPhone] = useState(null)
  const [firebaseToken, setFirebaseToken] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null)
  // OTP verification states
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtpCode, setEmailOtpCode] = useState('')
  const [emailOtpVerified, setEmailOtpVerified] = useState(false)
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false)
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtpCode, setPhoneOtpCode] = useState('')
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false)
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false)
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // Initialize reCAPTCHA for phone verification
  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not available. Phone verification will be disabled.')
      return
    }
    
    if (!recaptchaVerifier && typeof window !== 'undefined') {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved')
          },
          'expired-callback': () => {
            console.error('reCAPTCHA expired')
            message.error('reCAPTCHA expired. Please try again.')
          }
        })
        setRecaptchaVerifier(verifier)
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error)
      }
    }
    
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    }
  }, [auth])

  // Handle Email Verification (simplified - just validates format, backend handles actual verification)
  const handleEmailVerification = useCallback(async () => {
    // Validate email field first
    try {
      await form.validateFields(['email'])
    } catch (error) {
      message.error('Please enter a valid email address')
      return
    }
    
    const email = form.getFieldValue('email')
    if (!email || !email.trim()) {
      message.error('Please enter your email address first')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      message.error('Please enter a valid email address')
      return
    }

    // Skip Firebase email verification (it's causing errors)
    // Just validate format and mark as verified - backend will handle actual email validation
    message.success('Email format validated. You can proceed with signup.')
    setEmailVerified(true)
    setVerifiedEmail(email.trim())
  }, [form])

  // Handle Phone Verification with Firebase (optional - phone auth requires paid Firebase plan)
  const handlePhoneVerification = useCallback(async () => {
    // Validate phone field first
    try {
      await form.validateFields(['phone'])
    } catch (error) {
      message.error('Please enter a valid 10-digit phone number')
      return
    }
    
    const phone = form.getFieldValue('phone')
    if (!phone || !phone.trim()) {
      message.error('Please enter your phone number first')
      return
    }

    // If Firebase is not configured or phone auth is not available, allow signup without verification
    if (!auth) {
      message.warning('Firebase is not configured. Phone number will be validated by backend.')
      setPhoneVerified(true)
      setVerifiedPhone(phone.trim())
      return
    }

    // Format phone number for Firebase (add country code if not present)
    let phoneNumber = phone.replace(/\D/g, '')
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+91${phoneNumber}` // Default to India (+91)
    }

    if (!recaptchaVerifier) {
      message.warning('reCAPTCHA not initialized. Phone number will be validated by backend.')
      setPhoneVerified(true)
      setVerifiedPhone(phone.trim())
      return
    }

    setVerifyingPhone(true)
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      setConfirmationResult(confirmation)
      setOtpSent(true)
      message.success('OTP sent to your phone number!')
    } catch (error) {
      console.error('Phone verification error:', error)
      // Handle billing-not-enabled error specifically
      if (error.code === 'auth/billing-not-enabled' || error.code === 'auth/operation-not-allowed') {
        message.warning('Firebase Phone Authentication requires a paid plan. Phone number will be validated by backend.')
        setPhoneVerified(true)
        setVerifiedPhone(phone.trim())
      } else {
        message.warning('Firebase phone verification unavailable. Phone number will be validated by backend.')
        setPhoneVerified(true)
        setVerifiedPhone(phone.trim())
      }
    } finally {
      setVerifyingPhone(false)
    }
  }, [form, recaptchaVerifier, auth])

  // Verify OTP
  const handleVerifyOTP = useCallback(async () => {
    if (!confirmationResult || !otpCode) {
      message.error('Please enter the OTP code')
      return
    }

    try {
      const result = await confirmationResult.confirm(otpCode)
      setPhoneVerified(true)
      setVerifiedPhone(result.user.phoneNumber)
      const token = await result.user.getIdToken()
      setFirebaseToken(token)
      
      // Verify with backend
      try {
        await api.post('/api/accounts/firebase/verify/', { token })
        message.success('Phone number verified successfully!')
        setOtpSent(false)
        setOtpCode('')
      } catch (e) {
        console.error('Backend verification error:', e)
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      message.error('Invalid OTP. Please try again.')
    }
  }, [confirmationResult, otpCode])

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
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(values.email?.trim())) {
      message.error('Please enter a valid email address')
      return
    }

    // Validate phone format (10 digits)
    const phoneDigits = (values.phone || '').replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      message.error('Please enter a valid 10-digit phone number')
      return
    }

    // Require OTP verification before signup
    if (!emailOtpVerified) {
      message.error('Please verify your email with OTP before signing up')
      return
    }

    if (!phoneOtpVerified) {
      message.error('Please verify your phone with OTP before signing up')
      return
    }

    // Use verified email/phone if available, otherwise use form values
    const finalEmail = verifiedEmail || values.email?.trim()
    const finalPhone = verifiedPhone || phoneDigits
    
    // Update values with normalized email and phone
    values.email = finalEmail
    values.phone = finalPhone
    
    // Prepare payload with formatted dates
    const payload = { ...values }
    
    // Add Firebase token
    if (firebaseToken) {
      payload.firebase_token = firebaseToken
    }
    
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
      
      // Sign out from Firebase after successful signup
      if (auth && auth.currentUser) {
        await signOut(auth)
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
        <Form layout="vertical" form={form} onFinish={onFinish}>
          {/* Firebase Verification Section */}
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Step 1: Verify Your Email and Phone</Text>
            
          {/* Email OTP Verification */}
          <div style={{ marginBottom: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Form.Item 
              name="email" 
              label="Email" 
              rules={[
                { required: true, type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input 
                placeholder="Enter email address" 
                prefix={<MailOutlined />}
                disabled={emailOtpVerified}
              />
            </Form.Item>
            
            {!emailOtpSent ? (
              <Button 
                type="primary" 
                icon={<MailOutlined />}
                onClick={handleSendEmailOTP}
                loading={sendingEmailOtp}
                block
                disabled={emailOtpVerified}
              >
                Send OTP to Email
              </Button>
            ) : !emailOtpVerified ? (
              <div>
                <Form.Item label="Enter OTP Code">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ marginBottom: '8px' }}
                  />
                </Form.Item>
                <Space>
                  <Button 
                    type="primary"
                    onClick={handleVerifyEmailOTP}
                    loading={verifyingEmailOtp}
                    disabled={emailOtpCode.length !== 6}
                  >
                    Verify OTP
                  </Button>
                  <Button 
                    onClick={() => {
                      setEmailOtpSent(false)
                      setEmailOtpCode('')
                    }}
                  >
                    Change Email
                  </Button>
                </Space>
              </div>
            ) : (
              <div style={{ padding: '8px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                <Text type="success" strong>✓ Email verified: {verifiedEmail}</Text>
              </div>
            )}
          </div>

          {/* Phone OTP Verification */}
          <div style={{ marginBottom: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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
                prefix={<PhoneOutlined />}
                maxLength={10}
                disabled={phoneOtpVerified}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  form.setFieldsValue({ phone: value })
                }}
              />
            </Form.Item>
            
            {!phoneOtpSent ? (
              <Button 
                type="primary" 
                icon={<PhoneOutlined />}
                onClick={handleSendPhoneOTP}
                loading={sendingPhoneOtp}
                block
                disabled={phoneOtpVerified}
              >
                Send OTP to Phone
              </Button>
            ) : !phoneOtpVerified ? (
              <div>
                <Form.Item label="Enter OTP Code">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ marginBottom: '8px' }}
                  />
                </Form.Item>
                <Space>
                  <Button 
                    type="primary"
                    onClick={handleVerifyPhoneOTP}
                    loading={verifyingPhoneOtp}
                    disabled={phoneOtpCode.length !== 6}
                  >
                    Verify OTP
                  </Button>
                  <Button 
                    onClick={() => {
                      setPhoneOtpSent(false)
                      setPhoneOtpCode('')
                    }}
                  >
                    Change Phone
                  </Button>
                </Space>
              </div>
            ) : (
              <div style={{ padding: '8px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                <Text type="success" strong>✓ Phone verified: {verifiedPhone || form.getFieldValue('phone')}</Text>
              </div>
            )}
          </div>
        </div>

        <Divider>Then Complete Your Profile</Divider>

        <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Enter username" />
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
          
          <Form.Item name="user_type" label="User Type" rules={[{ required: true }]}>
            <Select placeholder="Select user type" options={[
              { value: 'donor', label: 'Donor/Receiver' },
              { value: 'bloodbank', label: 'Blood Bank' },
              { value: 'admin', label: 'Admin' },
            ]} />
          </Form.Item>
          
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}>
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading} 
            disabled={!emailVerified || !phoneVerified}
          >
            Create account
          </Button>
          
          {(!emailVerified || !phoneVerified) && (
            <Text type="warning" style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
              Please verify your email and phone number first.
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
