import { useState, useEffect } from 'react'
import { Table, Pagination, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Card, Row, Col } from 'antd'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { CalendarOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

export default function Camps() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [selectedCamp, setSelectedCamp] = useState(null)
  const [form] = Form.useForm()
  const { me } = useMe()
  const navigate = useNavigate()

  const columns = [
    { title: 'Camp Name', dataIndex: 'name', render: (name) => <strong>{name}</strong> },
    { title: 'Blood Bank', dataIndex: ['bloodbank', 'name'], render: (_, r) => <Tag color="blue">{r.bloodbank?.name || r.bloodbank}</Tag> },
    { title: 'City', dataIndex: 'city' },
    { title: 'Start Date', dataIndex: 'start_date' },
    { title: 'End Date', dataIndex: 'end_date', render: (date) => date || 'N/A' },
    { title: 'Registrations', dataIndex: 'registrations_count', render: (count) => <Tag color="green">{count || 0}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (me?.user_type !== 'bloodbank') {
          return (
            <Button
              type="primary"
              onClick={() => handleRegister(record)}
            >
              Register
            </Button>
          )
        }
        return (
          <Button
            type="link"
            onClick={() => navigate(`/camp-registrations?camp=${record.id}`)}
          >
            View Registrations
          </Button>
        )
      }
    }
  ]

  async function fetchData() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/bloodbank/camps/', { 
        params: { page, page_size: pageSize } 
      })
      setData(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      message.error('Failed to load camps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize])

  function handleRegister(camp) {
    setSelectedCamp(camp)
    setRegisterOpen(true)
    // Pre-fill form with user data if available
    form.resetFields()
    if (me) {
      form.setFieldsValue({
        full_name: me.profile?.full_name || me.username,
        email: me.email || '',
        phone: me.phone || '',
      })
    }
  }

  async function handleSubmit(values) {
    if (!selectedCamp) return
    try {
      const payload = {
        camp: selectedCamp.id,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        blood_group: values.blood_group,
        date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
        notes: values.notes || '',
      }
      await api.post('/api/bloodbank/camp-registrations/', payload)
      message.success('Successfully registered for the camp!')
      setRegisterOpen(false)
      setSelectedCamp(null)
      form.resetFields()
      fetchData() // Refresh to update registration count
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const fieldErrors = Object.entries(resp).map(([name, val]) => ({
          name,
          errors: [Array.isArray(val) ? val.join(', ') : String(val)],
        }))
        if (fieldErrors.length) form.setFields(fieldErrors)
        message.error('Please correct the highlighted fields')
      } else {
        message.error(e?.response?.data?.detail || 'Failed to register for camp')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Blood Donation Camps</h1>
      </div>

      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
      />

      <div className="mt-4 flex justify-end">
        <Pagination 
          current={page} 
          pageSize={pageSize} 
          total={total}
          onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
          showSizeChanger
        />
      </div>

      {/* Registration Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#667eea' }} />
            Register for Camp: {selectedCamp?.name}
          </div>
        }
        open={registerOpen}
        onCancel={() => {
          setRegisterOpen(false)
          setSelectedCamp(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        {selectedCamp && (
          <div>
            <Card size="small" style={{ marginBottom: '16px', background: '#f5f5f5' }}>
              <Row gutter={[8, 8]}>
                <Col span={24}>
                  <strong>Camp Details:</strong>
                </Col>
                <Col span={24}>
                  <EnvironmentOutlined /> {selectedCamp.address}, {selectedCamp.city}, {selectedCamp.state}
                </Col>
                <Col span={24}>
                  <CalendarOutlined /> Start: {selectedCamp.start_date} {selectedCamp.end_date && `- End: ${selectedCamp.end_date}`}
                </Col>
                {selectedCamp.contact_number && (
                  <Col span={24}>
                    <strong>Contact:</strong> {selectedCamp.contact_number}
                  </Col>
                )}
              </Row>
            </Card>

            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item 
                name="full_name" 
                label="Full Name" 
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input placeholder="Enter your full name" />
              </Form.Item>
              <Form.Item 
                name="email" 
                label="Email" 
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter your email" />
              </Form.Item>
              <Form.Item 
                name="phone" 
                label="Phone" 
                rules={[
                  { required: true, message: 'Please enter your phone number' },
                  { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' },
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
              <Form.Item 
                name="blood_group" 
                label="Blood Group" 
                rules={[{ required: true, message: 'Please select your blood group' }]}
              >
                <Select placeholder="Select blood group" options={[
                  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                ]} />
              </Form.Item>
              <Form.Item 
                name="date_of_birth" 
                label="Date of Birth"
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Select date of birth (optional)" />
              </Form.Item>
              <Form.Item 
                name="notes" 
                label="Notes (Optional)"
              >
                <Input.TextArea rows={3} placeholder="Any additional notes or information" />
              </Form.Item>
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => {
                  setRegisterOpen(false)
                  setSelectedCamp(null)
                  form.resetFields()
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  Register for Camp
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

