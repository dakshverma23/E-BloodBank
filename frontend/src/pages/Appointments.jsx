import { useState, useEffect, useCallback } from 'react'
import { Button, Modal, Form, DatePicker, Input, message, Table, Pagination, Card, Space, Typography, Tag, Descriptions, Divider, Input as AntInput, Empty, Spin } from 'antd'
import { SearchOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons'
import ListPage from '../components/ListPage'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { TextArea } = Input

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Blood bank search/list states
  const [bloodBanks, setBloodBanks] = useState([])
  const [bloodBanksLoading, setBloodBanksLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBank, setSelectedBank] = useState(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  
  // Appointment form
  const [appointmentForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const { me } = useMe()

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/donors/appointments/', {
        params: { page, page_size: pageSize }
      })
      setAppointments(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      console.error('Failed to load appointments:', e)
      message.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  // Fetch blood banks
  const fetchBloodBanks = useCallback(async (search = '') => {
    setBloodBanksLoading(true)
    try {
      const params = { page_size: 100 } // Get more results for search
      if (search && search.trim()) {
        params.search = search.trim()
      }
      // Try to get approved and operational blood banks
      // Note: Backend filterset_fields supports status and is_operational
      
      console.log('Fetching blood banks with params:', params)
      const { data } = await api.get('/api/bloodbank/bloodbanks/', { params })
      console.log('Blood banks response:', data)
      
      const banks = data.results || data || []
      console.log('Total banks received:', banks.length)
      
      // Client-side filter: prefer approved and operational, but show others if none found
      let filtered = Array.isArray(banks) ? banks.filter(bank => {
        // Show approved banks, or operational banks, or all if no approved ones exist
        return bank.status === 'approved' || bank.is_operational === true || bank.is_operational !== false
      }) : []
      
      // If no approved banks found, show all banks (for testing/debugging)
      if (filtered.length === 0 && banks.length > 0) {
        console.warn('No approved banks found, showing all banks')
        filtered = banks
      }
      
      console.log('Filtered blood banks:', filtered.length)
      setBloodBanks(filtered)
    } catch (e) {
      console.error('Failed to load blood banks:', e)
      console.error('Error details:', e.response?.data || e.message)
      message.error('Failed to load blood banks. Please try again.')
      setBloodBanks([])
    } finally {
      setBloodBanksLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments, refreshKey])

  // Load blood banks on mount and when me is available
  useEffect(() => {
    // Wait for me to be loaded, then fetch blood banks if user is not a blood bank
    if (me !== undefined && me?.user_type !== 'bloodbank') {
      console.log('Loading blood banks for user type:', me?.user_type)
      fetchBloodBanks('')
    }
  }, [me, fetchBloodBanks])

  // Debounce search query changes
  useEffect(() => {
    // Don't search if user is a blood bank or if me is not loaded yet
    if (me === undefined || me?.user_type === 'bloodbank') return
    
    const timer = setTimeout(() => {
      console.log('Searching blood banks with query:', searchQuery)
      fetchBloodBanks(searchQuery)
    }, 300) // Wait 300ms after user stops typing
    
    return () => clearTimeout(timer)
  }, [searchQuery, fetchBloodBanks, me])

  // Handle blood bank search
  const handleSearch = (value) => {
    setSearchQuery(value)
  }

  // Handle blood bank profile view
  const handleViewProfile = (bank) => {
    setSelectedBank(bank)
    setProfileModalOpen(true)
  }

  // Handle book appointment
  const handleBookAppointment = (bank) => {
    setSelectedBank(bank)
    setProfileModalOpen(false)
    setAppointmentModalOpen(true)
    appointmentForm.setFieldsValue({
      bloodbank: bank.id,
      appointment_date: undefined,
      notes: '',
    })
  }

  // Handle appointment submission
  const handleSubmitAppointment = async (values) => {
    if (!selectedBank) {
      message.error('Please select a blood bank')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        bloodbank: selectedBank.id,
        appointment_date: values.appointment_date ? values.appointment_date.format('YYYY-MM-DD') : undefined,
        notes: values.notes ? values.notes.trim() : '',
      }

      await api.post('/api/donors/appointments/', payload)
      message.success('Appointment booked successfully!')
      setAppointmentModalOpen(false)
      appointmentForm.resetFields()
      setSelectedBank(null)
      setRefreshKey(prev => prev + 1)
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const fieldErrors = Object.entries(resp).map(([name, val]) => ({
          name,
          errors: [Array.isArray(val) ? val.join(', ') : String(val)],
        }))
        if (fieldErrors.length) {
          appointmentForm.setFields(fieldErrors)
          message.error('Please correct the highlighted fields')
        } else {
          message.error('Failed to book appointment')
        }
      } else {
        message.error('Failed to book appointment')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const appointmentColumns = [
    {
      title: 'Blood Bank',
      dataIndex: ['bloodbank', 'name'],
      render: (_, r) => (
        <div>
          <Text strong>{r.bloodbank?.name || 'N/A'}</Text>
          {r.bloodbank?.city && (
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{r.bloodbank.city}</Text></div>
          )}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'appointment_date',
      render: (date) => date ? dayjs(date).format('MMMM DD, YYYY') : 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'gold', text: 'Pending' },
          confirmed: { color: 'green', text: 'Confirmed' },
          cancelled: { color: 'red', text: 'Cancelled' },
          completed: { color: 'blue', text: 'Completed' },
        }
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      render: (notes) => notes || '-',
    },
  ]

  // Use blood banks directly (already filtered by backend)
  const filteredBloodBanks = bloodBanks

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={2} style={{ margin: 0 }}>Appointments</Title>
      </div>

      {/* Blood Bank Search/List Section - Only show for donors */}
      {me?.user_type !== 'bloodbank' && (
        <Card 
          title={
            <Space>
              <CalendarOutlined />
              <span>Book Appointment with Blood Bank</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <AntInput
              placeholder="Search blood banks by name, city, or address..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              size="large"
            />
          </Space.Compact>

          {bloodBanksLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Loading blood banks...</Text>
              </div>
            </div>
          ) : filteredBloodBanks.length === 0 ? (
            <Empty 
              description={
                <div>
                  <Text>No blood banks found</Text>
                  {searchQuery && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Try a different search term or clear the search</Text>
                    </div>
                  )}
                  {!searchQuery && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">No approved blood banks available at the moment</Text>
                    </div>
                  )}
                </div>
              }
            />
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredBloodBanks.map((bank) => (
                <Card
                  key={bank.id}
                  size="small"
                  style={{ marginBottom: 12, cursor: 'pointer' }}
                  hoverable
                  onClick={() => handleViewProfile(bank)}
                  actions={[
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewProfile(bank)
                      }}
                    >
                      View Profile
                    </Button>,
                    <Button
                      type="default"
                      icon={<CalendarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookAppointment(bank)
                      }}
                    >
                      Book Appointment
                    </Button>,
                  ]}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <Text strong style={{ fontSize: '16px' }}>{bank.name}</Text>
                        {bank.status === 'approved' && (
                          <Tag color="green" style={{ marginLeft: 8 }}>Approved</Tag>
                        )}
                        {bank.is_operational && (
                          <Tag color="blue" style={{ marginLeft: 4 }}>Operational</Tag>
                        )}
                      </div>
                    </div>
                    {bank.city && (
                      <Text type="secondary">
                        <EnvironmentOutlined /> {bank.city}
                        {bank.state && `, ${bank.state}`}
                      </Text>
                    )}
                    {bank.address && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {bank.address}
                      </Text>
                    )}
                    {bank.phone && (
                      <Text type="secondary">
                        <PhoneOutlined /> {bank.phone}
                      </Text>
                    )}
                    {bank.operating_hours && (
                      <Text type="secondary">
                        <ClockCircleOutlined /> {bank.operating_hours}
                      </Text>
                    )}
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Appointments List */}
      <Card title="My Appointments">
        <Table
          rowKey={(r) => r.id}
          columns={appointmentColumns}
          dataSource={appointments}
          loading={loading}
          pagination={false}
        />
        <div className="mt-4 flex justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(p, ps) => {
              setPage(p)
              setPageSize(ps)
            }}
            showSizeChanger
          />
        </div>
      </Card>

      {/* Blood Bank Profile Modal */}
      <Modal
        title={
          <Space>
            <EnvironmentOutlined />
            <span>{selectedBank?.name || 'Blood Bank Profile'}</span>
          </Space>
        }
        open={profileModalOpen}
        onCancel={() => {
          setProfileModalOpen(false)
          setSelectedBank(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setProfileModalOpen(false)
            setSelectedBank(null)
          }}>
            Close
          </Button>,
          <Button
            key="book"
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => {
              if (selectedBank) {
                handleBookAppointment(selectedBank)
              }
            }}
          >
            Book Appointment
          </Button>,
        ]}
        width={700}
      >
        {selectedBank && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Name">
              <Text strong>{selectedBank.name}</Text>
              {selectedBank.status === 'approved' && (
                <Tag color="green" style={{ marginLeft: 8 }}>Approved</Tag>
              )}
              {selectedBank.is_operational && (
                <Tag color="blue" style={{ marginLeft: 4 }}>Operational</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Registration Number">
              {selectedBank.registration_number || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <Space direction="vertical" size="small">
                {selectedBank.address && <Text>{selectedBank.address}</Text>}
                {(selectedBank.city || selectedBank.state || selectedBank.pincode) && (
                  <Text type="secondary">
                    {selectedBank.city && `${selectedBank.city}, `}
                    {selectedBank.state && `${selectedBank.state} `}
                    {selectedBank.pincode && `- ${selectedBank.pincode}`}
                  </Text>
                )}
                {selectedBank.latitude && selectedBank.longitude && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <EnvironmentOutlined /> Coordinates: {selectedBank.latitude}, {selectedBank.longitude}
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              <Space direction="vertical" size="small">
                {selectedBank.phone && (
                  <Text>
                    <PhoneOutlined /> {selectedBank.phone}
                  </Text>
                )}
                {selectedBank.email && (
                  <Text>
                    <MailOutlined /> {selectedBank.email}
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Operating Hours">
              <Text>
                <ClockCircleOutlined /> {selectedBank.operating_hours || '24/7'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedBank.status === 'approved' ? 'green' : selectedBank.status === 'pending' ? 'gold' : 'red'}>
                {selectedBank.status || 'N/A'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Appointment Booking Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Book Appointment</span>
            {selectedBank && <Text type="secondary">- {selectedBank.name}</Text>}
          </Space>
        }
        open={appointmentModalOpen}
        onCancel={() => {
          setAppointmentModalOpen(false)
          appointmentForm.resetFields()
          setSelectedBank(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          form={appointmentForm}
          onFinish={handleSubmitAppointment}
        >
          {selectedBank && (
            <Card size="small" style={{ marginBottom: 16, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong style={{ color: '#1890ff' }}>Selected Blood Bank:</Text>
                <Text><strong>Name:</strong> {selectedBank.name}</Text>
                {selectedBank.address && (
                  <Text><strong>Address:</strong> {selectedBank.address}</Text>
                )}
                {(selectedBank.city || selectedBank.state) && (
                  <Text>
                    <strong>Location:</strong> {selectedBank.city}
                    {selectedBank.state && `, ${selectedBank.state}`}
                    {selectedBank.pincode && ` - ${selectedBank.pincode}`}
                  </Text>
                )}
                {selectedBank.phone && (
                  <Text><strong>Phone:</strong> {selectedBank.phone}</Text>
                )}
                {selectedBank.operating_hours && (
                  <Text><strong>Operating Hours:</strong> {selectedBank.operating_hours}</Text>
                )}
              </Space>
            </Card>
          )}

          <Form.Item
            name="bloodbank"
            label="Blood Bank ID"
            style={{ display: 'none' }}
          >
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="appointment_date"
            label="Appointment Date"
            rules={[
              { required: true, message: 'Please select appointment date' },
              {
                validator: (_, value) => {
                  if (value && value.isBefore(dayjs().startOf('day'))) {
                    return Promise.reject('Appointment date cannot be in the past')
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Any additional notes or special requests..."
            />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setAppointmentModalOpen(false)
                  appointmentForm.resetFields()
                  setSelectedBank(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<CalendarOutlined />}
              >
                Book Appointment
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}