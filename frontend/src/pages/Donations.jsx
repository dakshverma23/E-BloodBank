import ListPage from '../components/ListPage'
import { useEffect, useMemo, useState } from 'react'
import { DatePicker, Input, InputNumber, Select, message } from 'antd'
import useMe from '../hooks/useMe'
import { api } from '../api/client'

export default function Donations() {
  const [open, setOpen] = useState(false)
  const { me } = useMe()
  // We will accept a User ID only, and resolve donor by user filter on submit
  async function beforeCreate(values) {
    const userId = (values.user_id || '').toString().trim()
    
    // Validate User ID format
    if (!userId) {
      message.error('Please enter a Donor User ID')
      throw new Error('User ID is required')
    }
    
    if (!/^\d+$/.test(userId)) {
      message.error('User ID must be a numeric value')
      throw new Error('Invalid User ID format')
    }
    
    try {
      // Lookup donor by user ID
      const { data } = await api.get('/api/donors/donors/', { params: { user: userId } })
      const list = data.results || data || []
      
      if (!Array.isArray(list) || list.length === 0) {
        message.error(`No donor profile found for User ID ${userId}. Make sure the user has registered as a donor.`)
        throw new Error('Donor not found')
      }
      
      const donor = list[0]
      if (!donor || !donor.id) {
        message.error('Donor data is invalid. Please try again.')
        throw new Error('Invalid donor data')
      }
      
      const donorId = donor.id
      const { user_id, ...rest } = values
      
      // Return the payload with donor ID instead of user_id
      return { ...rest, donor: donorId }
    } catch (e) {
      // If it's already a handled error, re-throw it
      if (e.message === 'User ID is required' || e.message === 'Invalid User ID format' || 
          e.message === 'Donor not found' || e.message === 'Invalid donor data') {
        throw e
      }
      
      // Handle API errors
      if (e?.response?.status === 400) {
        message.error('Invalid request. Please check the User ID.')
      } else if (e?.response?.status === 404) {
        message.error('No donor found for the provided User ID')
      } else if (e?.response?.status === 403) {
        message.error('You do not have permission to perform this action')
      } else {
        message.error('Failed to lookup donor. Please check the User ID and try again.')
      }
      throw e
    }
  }
  const columns = [
    { title: 'Donor', dataIndex: ['donor', 'full_name'], render: (_, r) => r.donor?.full_name || r.donor },
    { title: 'Blood Bank', dataIndex: ['bloodbank', 'name'], render: (_, r) => r.bloodbank?.name || r.bloodbank },
    { title: 'Date', dataIndex: 'donation_date' },
    { title: 'Units', dataIndex: 'units_donated' },
  ]

  // Blood bank users can add donations; bank is auto-assigned server-side
  const createFields = me?.user_type === 'bloodbank' ? [
    { name: 'user_id', label: 'Donor User ID', rules: [{ required: true }], input: <Input placeholder="Enter donor's User ID"/> },
    { name: 'donation_date', label: 'Donation Date', rules: [{ required: true }], input: <DatePicker className="w-full" /> },
    { name: 'units_donated', label: 'Units Donated', rules: [{ required: true }], input: <InputNumber className="w-full" min={1} /> },
    { name: 'hemoglobin_level', label: 'Hemoglobin (g/dL)', input: <InputNumber className="w-full" step={0.1} /> },
    { name: 'blood_pressure', label: 'Blood Pressure' },
    { name: 'verified_by', label: 'Verified By', rules: [{ required: true }] },
    { name: 'notes', label: 'Notes', input: <Input.TextArea rows={2} /> },
  ] : []

  return (
    <div>
      <ListPage title="Donations" columns={columns} endpoint="/api/donors/donations/" createFields={createFields} beforeCreate={beforeCreate} />
    </div>
  )
}


