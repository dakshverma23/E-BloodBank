import ListPage from '../components/ListPage'
import { useEffect, useMemo, useState } from 'react'
import { DatePicker, Input, InputNumber, Select, message, Button, Card, Space, Typography, Form } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import useMe from '../hooks/useMe'
import { api } from '../api/client'

const { Text } = Typography

export default function Donations() {
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [userData, setUserData] = useState(null)
  const [form, setForm] = useState(null)
  const { me } = useMe()

  // Handle email search
  const handleSearchUser = async (email) => {
    if (!email || !email.trim()) {
      message.warning('Please enter an email address')
      return
    }

    setSearching(true)
    try {
      const { data } = await api.post('/api/accounts/search-by-email/', { email: email.trim() })
      setUserData(data)
      message.success(`Found user: ${data.username} (ID: ${data.id})`)
      
      // Auto-fill form fields if form is available
      if (form) {
        // Fill user_id from found user
        form.setFieldsValue({
          user_id: data.id,
          email: data.email,
        })
        
        // If donor profile exists, fill donor details
        if (data.donor) {
          form.setFieldsValue({
            blood_group: data.donor.blood_group || 'O+',
          })
          message.info('Donor profile found. Donation details filled automatically.')
        } else {
          message.info('User found but no donor profile. A donor profile will be created automatically with the donation.')
        }
      }
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const errorMsg = resp.error || Object.values(resp).flat().join(', ')
        message.error(errorMsg || 'User not found')
      } else {
        message.error('User not found. Please check the email address.')
      }
      setUserData(null)
      if (form) {
        form.setFieldsValue({
          user_id: undefined,
          email: undefined,
        })
      }
    } finally {
      setSearching(false)
    }
  }

  // We will accept email or user_id and let backend auto-create donor profile if it doesn't exist
  async function beforeCreate(values) {
    try {
      // Check if email is provided, use it; otherwise use user_id
      const email = (values.email || '').toString().trim()
      const userId = (values.user_id || '').toString().trim()
      
      if (!email && !userId) {
        message.error('Please enter either an email address or User ID')
        throw new Error('Email or User ID is required')
      }
      
      // Prepare payload
      const payload = {
        donation_date: values.donation_date, // Keep as Dayjs object, ListPage will format it
        units_donated: values.units_donated ? Number(values.units_donated) : 1, // Default to 1 if not provided
        verified_by: values.verified_by ? values.verified_by.trim() : '', // Always include, even if empty (backend will validate)
        blood_group: values.blood_group || 'O+', // Pass blood group if provided, default to O+
      }
      
      // Add email or user_id
      if (email) {
        payload.email = email
      } else if (userId) {
        if (!/^\d+$/.test(userId)) {
          message.error('User ID must be a numeric value')
          throw new Error('Invalid User ID format')
        }
        payload.user_id = parseInt(userId, 10)
      }
      
      // Add optional fields only if they have values
      if (values.hemoglobin_level !== null && values.hemoglobin_level !== undefined && values.hemoglobin_level !== '') {
        payload.hemoglobin_level = Number(values.hemoglobin_level)
      }
      
      if (values.blood_pressure && values.blood_pressure.trim()) {
        payload.blood_pressure = values.blood_pressure.trim()
      }
      
      if (values.notes && values.notes.trim()) {
        payload.notes = values.notes.trim()
      }
      
      return payload
    } catch (e) {
      // Re-throw validation errors - let backend handle validation
      throw e
    }
  }

  const columns = [
    { title: 'Donor', dataIndex: ['donor', 'full_name'], render: (_, r) => r.donor?.full_name || r.donor },
    { title: 'Blood Bank', dataIndex: ['bloodbank', 'name'], render: (_, r) => r.bloodbank?.name || r.bloodbank },
    { title: 'Date', dataIndex: 'donation_date' },
    { title: 'Units', dataIndex: 'units_donated' },
  ]

  // Custom form component with email search
  const CustomDonationForm = ({ form: formInstance, onFinish, onCancel }) => {
    const [emailInput, setEmailInput] = useState('')
    const [localUserData, setLocalUserData] = useState(null)
    const [localSearching, setLocalSearching] = useState(false)
    
    // Store form instance for email search
    useEffect(() => {
      if (formInstance) {
        setForm(formInstance)
      }
    }, [formInstance])
    
    const handleSearch = async () => {
      if (!emailInput || !emailInput.trim()) {
        message.warning('Please enter an email address')
        return
      }

      setLocalSearching(true)
      setSearching(true)
      try {
        const { data } = await api.post('/api/accounts/search-by-email/', { email: emailInput.trim() })
        setLocalUserData(data)
        setUserData(data)
        message.success(`Found user: ${data.username} (ID: ${data.id})`)
        
        // Auto-fill form fields with user data - fetch ALL available details
        const formValues = {
          user_id: data.id,
          email: data.email,
        }
        
        // If donor profile exists, fill all donor details including blood group
        if (data.donor) {
          formValues.blood_group = data.donor.blood_group || 'O+'
          // Note: Donation form doesn't need all donor fields, but we show them in the card
          message.success('Donor profile found. Blood group auto-filled. All details displayed below.')
        } else {
          // If no donor profile but user profile exists, suggest values
          if (data.profile) {
            message.info('User profile found but no donor profile. A donor profile will be created automatically when donation is submitted.')
          } else {
            message.info('User found but no donor profile. A donor profile will be created automatically when donation is submitted.')
          }
        }
        
        formInstance.setFieldsValue(formValues)
      } catch (e) {
        const resp = e?.response?.data
        if (resp && typeof resp === 'object') {
          const errorMsg = resp.error || Object.values(resp).flat().join(', ')
          message.error(errorMsg || 'User not found')
        } else {
          message.error('User not found. Please check the email address.')
        }
        setLocalUserData(null)
        setUserData(null)
        formInstance.setFieldsValue({
          user_id: undefined,
          email: undefined,
          blood_group: undefined,
        })
      } finally {
        setLocalSearching(false)
        setSearching(false)
      }
    }

    return (
      <Form layout="vertical" form={formInstance} onFinish={onFinish}>
        <Form.Item 
          name="email" 
          label="Donor Email"
          rules={[
            { required: true, message: 'Please enter donor email' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input 
              placeholder="Enter donor's email address" 
              prefix={<UserOutlined />}
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                formInstance.setFieldsValue({ email: e.target.value })
                // Clear user data when email changes
                if (localUserData) {
                  setLocalUserData(null)
                  setUserData(null)
                }
              }}
              onPressEnter={handleSearch}
            />
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={localSearching}
            >
              Search
            </Button>
          </Space.Compact>
        </Form.Item>
        
        {localUserData && (
          <Card size="small" style={{ marginBottom: 16, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong style={{ color: '#1890ff' }}>✓ User Found:</Text>
              <Text><strong>Name:</strong> {localUserData.username}</Text>
              <Text><strong>Email:</strong> {localUserData.email}</Text>
              <Text><strong>Mobile Number:</strong> {localUserData.phone || 'Not provided'}</Text>
              <Text><strong>User ID:</strong> {localUserData.id}</Text>
              {localUserData.donor && (
                <>
                  <Text><strong>Blood Group:</strong> {localUserData.donor.blood_group}</Text>
                  <Text><strong>Full Name:</strong> {localUserData.donor.full_name}</Text>
                  <Text><strong>Weight:</strong> {localUserData.donor.weight ? `${localUserData.donor.weight} kg` : 'Not provided'}</Text>
                  <Text><strong>Mobile Number (Donor):</strong> {localUserData.donor.phone || localUserData.phone || 'Not provided'}</Text>
                  {localUserData.donor.gender && <Text><strong>Gender:</strong> {localUserData.donor.gender === 'M' ? 'Male' : localUserData.donor.gender === 'F' ? 'Female' : 'Other'}</Text>}
                  {localUserData.donor.date_of_birth && <Text><strong>Date of Birth:</strong> {localUserData.donor.date_of_birth}</Text>}
                  {localUserData.donor.address && <Text><strong>Address:</strong> {localUserData.donor.address}</Text>}
                  {localUserData.donor.city && <Text><strong>City:</strong> {localUserData.donor.city}</Text>}
                  {localUserData.donor.state && <Text><strong>State:</strong> {localUserData.donor.state}</Text>}
                  {localUserData.donor.pincode && <Text><strong>Pincode:</strong> {localUserData.donor.pincode}</Text>}
                  {localUserData.donor.emergency_contact && <Text><strong>Emergency Contact:</strong> {localUserData.donor.emergency_contact}</Text>}
                  {localUserData.donor.medical_conditions && <Text><strong>Medical Conditions:</strong> {localUserData.donor.medical_conditions}</Text>}
                </>
              )}
              {!localUserData.donor && localUserData.profile && (
                <>
                  {localUserData.profile.city && <Text><strong>City:</strong> {localUserData.profile.city}</Text>}
                  {localUserData.profile.state && <Text><strong>State:</strong> {localUserData.profile.state}</Text>}
                  {localUserData.profile.address && <Text><strong>Address:</strong> {localUserData.profile.address}</Text>}
                  {localUserData.profile.pincode && <Text><strong>Pincode:</strong> {localUserData.profile.pincode}</Text>}
                </>
              )}
            </Space>
          </Card>
        )}
        
        <Form.Item 
          name="user_id" 
          label="Donor User ID"
          style={{ display: 'none' }}
        >
          <Input type="hidden" />
        </Form.Item>
        
        <Form.Item 
          name="blood_group" 
          label="Blood Group"
          tooltip="Required if creating new donor profile. Auto-filled if donor profile exists."
        >
          <Select placeholder="Select blood group (optional)" options={[
            { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
            { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
            { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
            { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
          ]} />
        </Form.Item>
        
        <Form.Item 
          name="donation_date" 
          label="Donation Date" 
          rules={[{ required: true, message: 'Please select donation date' }]}
        >
          <DatePicker className="w-full" format="YYYY-MM-DD" style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item 
          name="units_donated" 
          label="Units Donated" 
          rules={[{ required: true, message: 'Please enter units donated' }]}
        >
          <InputNumber className="w-full" min={1} placeholder="Enter units donated" style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item 
          name="hemoglobin_level" 
          label="Hemoglobin (g/dL)"
        >
          <InputNumber className="w-full" step={0.1} placeholder="Enter hemoglobin level" style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item 
          name="blood_pressure" 
          label="Blood Pressure"
        >
          <Input placeholder="Enter blood pressure (e.g., 120/80)" />
        </Form.Item>
        
        <Form.Item 
          name="verified_by" 
          label="Verified By" 
          rules={[{ required: true, message: 'Please enter verifier name' }]}
        >
          <Input placeholder="Enter verifier name" />
        </Form.Item>
        
        <Form.Item 
          name="notes" 
          label="Notes"
        >
          <Input.TextArea rows={2} placeholder="Enter any additional notes" />
        </Form.Item>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">Create Donation</Button>
        </div>
      </Form>
    )
  }

  // Blood bank users can add donations; bank is auto-assigned server-side
  const createFields = me?.user_type === 'bloodbank' ? [] : [] // Using custom form instead

  return (
    <div>
      {me?.user_type === 'bloodbank' ? (
        <ListPage 
          title="Donations" 
          columns={columns} 
          endpoint="/api/donors/donations/" 
          createFields={createFields} 
          beforeCreate={beforeCreate}
          customCreateForm={CustomDonationForm}
        />
      ) : (
        <ListPage 
          title="Donations" 
          columns={columns} 
          endpoint="/api/donors/donations/" 
          createFields={createFields} 
          beforeCreate={beforeCreate}
        />
      )}
    </div>
  )
}
