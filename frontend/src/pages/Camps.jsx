import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Input, Button, Modal, Form, Input as AntInput, Select, DatePicker, message, Tag, Space, Typography, Skeleton, Empty, Pagination, Divider } from 'antd'
import { SearchOutlined, CalendarOutlined, EnvironmentOutlined, PhoneOutlined, TeamOutlined, BankOutlined, CheckCircleOutlined, GlobalOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input
const { TextArea } = AntInput

export default function Camps() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [selectedCamp, setSelectedCamp] = useState(null)
  const [form] = Form.useForm()
  const { me } = useMe()
  const navigate = useNavigate()
  const [registeredCampIds, setRegisteredCampIds] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const isRegistered = (campId) => {
    return registeredCampIds.has(campId)
  }

  async function fetchRegisteredCamps() {
    if (!me || me?.user_type === 'bloodbank') {
      return
    }
    
    try {
      const { data } = await api.get('/api/bloodbank/camp-registrations/', {
        params: { page_size: 1000 }
      })
      const registrations = data.results || data || []
      const campIds = new Set(registrations.map(reg => {
        if (typeof reg.camp === 'object' && reg.camp?.id) {
          return reg.camp.id
        }
        return reg.camp
      }).filter(Boolean))
      setRegisteredCampIds(campIds)
    } catch (e) {
      console.error('Failed to fetch registered camps:', e)
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      const [campsResponse] = await Promise.all([
        api.get('/api/bloodbank/camps/', { 
          params: { page, page_size: pageSize } 
        }),
        fetchRegisteredCamps()
      ])
      const { data } = campsResponse
      const camps = data.results || data || []
      setData(camps)
      setFilteredData(camps)
      setTotal(data.count || camps.length)
    } catch (e) {
      message.error('Failed to load camps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, me?.user_type])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredData(data)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = data.filter(camp =>
      camp.name?.toLowerCase().includes(query) ||
      camp.city?.toLowerCase().includes(query) ||
      camp.bloodbank?.name?.toLowerCase().includes(query) ||
      camp.address?.toLowerCase().includes(query)
    )
    setFilteredData(filtered)
  }, [searchQuery, data])

  function handleRegister(camp) {
    setSelectedCamp(camp)
    setRegisterOpen(true)
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
      
      if (selectedCamp?.id) {
        setRegisteredCampIds(prev => new Set([...prev, selectedCamp.id]))
      }
      
      fetchData()
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

  const renderCampCard = (camp) => {
    const alreadyRegistered = isRegistered(camp.id)
    const startDate = camp.start_date ? dayjs(camp.start_date).format('MMM DD, YYYY') : 'N/A'
    const endDate = camp.end_date ? dayjs(camp.end_date).format('MMM DD, YYYY') : null

    return (
      <Col xs={24} sm={24} md={12} lg={8} key={camp.id}>
        <Card
          hoverable
          style={{
            height: '100%',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
          }}
          styles={{ body: { padding: '20px' } }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Title level={4} style={{ margin: 0, color: '#262626', flex: 1 }}>
                <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                {camp.name || 'N/A'}
              </Title>
            </div>
            <Space size="small" wrap>
              <Tag color="blue" icon={<BankOutlined />}>
                {camp.bloodbank?.name || camp.bloodbank || 'N/A'}
              </Tag>
              {camp.registrations_count !== undefined && (
                <Tag color="green" icon={<TeamOutlined />}>
                  {camp.registrations_count} Registrations
                </Tag>
              )}
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {(camp.city || camp.state) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <EnvironmentOutlined style={{ color: '#52c41a', fontSize: '16px', marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  {camp.address && (
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                      {camp.address}
                    </Text>
                  )}
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {[camp.city, camp.state].filter(Boolean).join(', ')}
                  </Text>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
              <Text type="secondary" style={{ fontSize: '13px' }}>
                <Text strong style={{ color: '#262626' }}>Start:</Text> {startDate}
                {endDate && (
                  <>
                    <br />
                    <Text strong style={{ color: '#262626' }}>End:</Text> {endDate}
                  </>
                )}
              </Text>
            </div>

            {camp.contact_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
                <Text 
                  type="secondary" 
                  style={{ fontSize: '13px' }}
                  copyable={{ text: camp.contact_number, tooltips: ['Copy', 'Copied!'] }}
                >
                  {camp.contact_number}
                </Text>
              </div>
            )}
          </Space>

          <Divider style={{ margin: '16px 0' }} />

          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            {me?.user_type !== 'bloodbank' ? (
              <Button
                type={alreadyRegistered ? 'default' : 'primary'}
                disabled={alreadyRegistered}
                icon={alreadyRegistered ? <CheckCircleOutlined /> : <CalendarOutlined />}
                onClick={() => !alreadyRegistered && handleRegister(camp)}
                style={{ flex: 1 }}
              >
                {alreadyRegistered ? 'Registered' : 'Register'}
              </Button>
            ) : (
              <Button
                type="link"
                icon={<GlobalOutlined />}
                onClick={() => navigate(`/camp-registrations?camp=${camp.id}`)}
              >
                View Registrations
              </Button>
            )}
          </Space>
        </Card>
      </Col>
    )
  }

  if (loading && data.length === 0) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 6 }} />
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          {[1, 2, 3].map(i => (
            <Col xs={24} sm={24} md={12} lg={8} key={i}>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, marginBottom: '8px', color: '#262626' }}>
          <CalendarOutlined style={{ color: '#1890ff', marginRight: '12px' }} />
          Blood Donation Camps
        </Title>
        <Text type="secondary">
          Find and register for blood donation camps near you
        </Text>
      </div>

      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        styles={{ body: { padding: '16px' } }}
      >
        <Search
          placeholder="Search by camp name, city, blood bank, or address..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          size="large"
        />
      </Card>

      {filteredData.length === 0 ? (
        <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px' }}>
          <Empty
            description={
              <Text type="secondary">
                {data.length === 0
                  ? 'No donation camps available'
                  : 'No camps match your search criteria'}
              </Text>
            }
          />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {filteredData.map(renderCampCard)}
          </Row>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps)
              }}
              showSizeChanger
              showTotal={(total) => `Total ${total} camps`}
            />
          </div>
        </>
      )}

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
            <Card size="small" style={{ marginBottom: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>Camp Details:</Text>
                <Text type="secondary">
                  <EnvironmentOutlined /> {selectedCamp.address}, {selectedCamp.city}, {selectedCamp.state}
                </Text>
                <Text type="secondary">
                  <CalendarOutlined /> Start: {dayjs(selectedCamp.start_date).format('MMMM DD, YYYY')}
                  {selectedCamp.end_date && ` - End: ${dayjs(selectedCamp.end_date).format('MMMM DD, YYYY')}`}
                </Text>
                {selectedCamp.contact_number && (
                  <Text type="secondary">
                    <PhoneOutlined /> Contact: {selectedCamp.contact_number}
                  </Text>
                )}
              </Space>
            </Card>

            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item 
                name="full_name" 
                label="Full Name" 
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <AntInput placeholder="Enter your full name" />
              </Form.Item>
              <Form.Item 
                name="email" 
                label="Email" 
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <AntInput placeholder="Enter your email" />
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
                <AntInput 
                  placeholder="Enter 10-digit phone number" 
                  maxLength={10}
                  onChange={(e) => {
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
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Select date of birth (optional)" />
              </Form.Item>
              <Form.Item 
                name="notes" 
                label="Notes (Optional)"
              >
                <TextArea rows={3} placeholder="Any additional notes or information" />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
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
