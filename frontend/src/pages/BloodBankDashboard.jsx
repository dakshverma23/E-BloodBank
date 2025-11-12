import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Space, Tag, Table, List, Button, Modal, Form, Input, DatePicker, message, Skeleton, Progress } from 'antd'
import { AppstoreOutlined, ExclamationCircleOutlined, CalendarOutlined, EnvironmentOutlined, LoadingOutlined, HeartOutlined, DropboxOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import { getCurrentAddress } from '../utils/geolocation'

export default function BloodBankDashboard() {
  const [loading, setLoading] = useState(true)
  const [inv, setInv] = useState([])
  const [camps, setCamps] = useState([])
  const [stats, setStats] = useState({ inventoryCount: 0, lowStock: 0, campCount: 0, donations: 0, requests: 0 })
  const [open, setOpen] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [invResp, campsResp, donationsResp, requestsResp] = await Promise.all([
          api.get('/api/bloodbank/bloodbanks/my_inventory/'),
          api.get('/api/bloodbank/camps/?mine=true'),
          api.get('/api/donors/donations/', { params: { page: 1 } }),
          api.get('/api/requests/requests/', { params: { page: 1 } }),
        ])
        if (!mounted) return
        const inventory = invResp.data || []
        const campList = campsResp.data.results || campsResp.data || []
        setInv(inventory)
        setCamps(campList)
        setStats({
          inventoryCount: inventory.length,
          lowStock: inventory.filter(i => i.units_available <= i.min_stock_level).length,
          campCount: campList.length,
          donations: donationsResp.data.count ?? (donationsResp.data.results?.length || donationsResp.data.length || 0),
          requests: requestsResp.data.count ?? (requestsResp.data.results?.length || requestsResp.data.length || 0),
        })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function handleUseLocation() {
    setLoadingLocation(true)
    try {
      const addressData = await getCurrentAddress()
      form.setFieldsValue({
        address: addressData.address || addressData.street || '',
        city: addressData.city || '',
        state: addressData.state || '',
        pincode: addressData.pincode || '',
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      })
      message.success('Location detected and address filled!')
    } catch (error) {
      message.error(error.message || 'Failed to get your location. Please allow location access.')
    } finally {
      setLoadingLocation(false)
    }
  }

  async function createCamp(values) {
    try {
      // Validate all required fields are present
      if (!values.name || !values.name.trim()) {
        form.setFields([{ name: 'name', errors: ['Camp name is required'] }])
        return
      }
      if (!values.address || !values.address.trim()) {
        form.setFields([{ name: 'address', errors: ['Address is required'] }])
        return
      }
      if (!values.city || !values.city.trim()) {
        form.setFields([{ name: 'city', errors: ['City is required'] }])
        return
      }
      if (!values.start_date) {
        form.setFields([{ name: 'start_date', errors: ['Start date is required'] }])
        return
      }

      const payload = {
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        state: values.state?.trim() || '',
        pincode: values.pincode?.trim() || '',
        start_date: values.start_date.format('YYYY-MM-DD'),
        latitude: values.latitude || null,
        longitude: values.longitude || null,
      }
      await api.post('/api/bloodbank/camps/', payload)
      message.success('Camp created successfully')
      setOpen(false)
      form.resetFields()
      // Refresh camps list
      const r = await api.get('/api/bloodbank/camps/?mine=true')
      setCamps(r.data.results || r.data)
      // Update stats
      setStats(prev => ({ ...prev, campCount: (r.data.results || r.data || []).length }))
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
        message.error('Failed to create camp. Please try again.')
      }
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />

  const statCards = [
    {
      title: 'Inventory Items',
      value: stats.inventoryCount,
      icon: <DropboxOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      iconBg: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStock,
      icon: <ExclamationCircleOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      iconBg: 'rgba(245, 87, 108, 0.1)',
    },
    {
      title: 'Upcoming Camps',
      value: stats.campCount,
      icon: <CalendarOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      iconBg: 'rgba(79, 172, 254, 0.1)',
    },
    {
      title: 'Total Donations',
      value: stats.donations,
      icon: <HeartOutlined />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      iconBg: 'rgba(250, 112, 154, 0.1)',
    },
    {
      title: 'Blood Requests',
      value: stats.requests,
      icon: <ThunderboltOutlined />,
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      iconBg: 'rgba(48, 207, 208, 0.1)',
    },
  ]

  return (
    <div style={{ padding: '8px 0' }}>
      <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
        {statCards.map((stat, idx) => (
          <Col xs={24} sm={12} md={8} lg={idx < 3 ? 8 : 6} key={idx}>
            <Card
              bordered={false}
              style={{
                background: stat.gradient,
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
              }}
              bodyStyle={{ padding: '20px' }}
              hoverable
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'rgba(255,255,255,0.9)', 
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}>
                    {stat.title}
                  </div>
                  <Statistic
                    value={stat.value}
                    valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: stat.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#fff',
                }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DropboxOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                <span style={{ fontWeight: 600, fontSize: '16px' }}>My Inventory</span>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '12px',
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Table
              rowKey={(r) => r.id}
              dataSource={inv}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Blood Group',
                  dataIndex: 'blood_group',
                  render: (g) => (
                    <Tag
                      color="volcano"
                      style={{
                        borderRadius: '6px',
                        padding: '4px 12px',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      {g}
                    </Tag>
                  ),
                },
                {
                  title: 'Units Available',
                  dataIndex: 'units_available',
                  render: (u, r) => {
                    const isLow = u <= r.min_stock_level
                    const percentage = r.min_stock_level > 0 ? Math.min((u / (r.min_stock_level * 2)) * 100, 100) : 100
                    return (
                      <div>
                        <span
                          style={{
                            color: isLow ? '#ff4d4f' : '#52c41a',
                            fontWeight: isLow ? 700 : 500,
                            fontSize: '15px',
                          }}
                        >
                          {u}
                        </span>
                        <Progress
                          percent={percentage}
                          size="small"
                          strokeColor={isLow ? '#ff4d4f' : '#52c41a'}
                          showInfo={false}
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    )
                  },
                },
                {
                  title: 'Min Stock',
                  dataIndex: 'min_stock_level',
                  render: (val) => <span style={{ color: '#666', fontSize: '14px' }}>{val}</span>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ color: '#4facfe', fontSize: '20px' }} />
                <span style={{ fontWeight: 600, fontSize: '16px' }}>My Donation Camps</span>
              </div>
            }
            bordered={false}
            extra={
              <Button
                type="primary"
                onClick={() => setOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                }}
              >
                Create Camp
              </Button>
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <List
              dataSource={camps}
              size="small"
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '18px',
                        }}
                      >
                        <EnvironmentOutlined />
                      </div>
                    }
                    title={
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>
                        {item.name}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {item.city} • Starts {item.start_date}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600 }}>
            <CalendarOutlined style={{ color: '#4facfe' }} />
            Create Donation Camp
          </div>
        }
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
        style={{ top: 50 }}
      >
        <Form layout="vertical" form={form} onFinish={createCamp}>
          <Form.Item name="name" label="Name" rules={[{required: true, message: 'Please enter camp name'}]}> 
            <Input placeholder="Community Drive"/> 
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
            rules={[{required: true, message: 'Please enter address'}]}
          > 
            <Input.TextArea rows={2} placeholder="Address will be auto-filled when you click 'Use My Location'"/> 
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{required: true, message: 'Please enter city'}]}> 
            <Input placeholder="City will be auto-filled from your location"/> 
          </Form.Item>
          <Form.Item name="state" label="State"> 
            <Input placeholder="State will be auto-filled from your location"/> 
          </Form.Item>
          <Form.Item name="pincode" label="Pincode"> 
            <Input placeholder="Pincode will be auto-filled from your location"/> 
          </Form.Item>
          <Form.Item name="start_date" label="Start Date" rules={[{required: true, message: 'Please select start date'}]}> 
            <DatePicker className="w-full" format="YYYY-MM-DD" /> 
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button
              onClick={() => {
                setOpen(false)
                form.resetFields()
              }}
              style={{ borderRadius: '6px' }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              Create Camp
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


