import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Space, Tag, Table, List, Button, Modal, Form, Input, DatePicker, message, Skeleton } from 'antd'
import { AppstoreOutlined, ExclamationCircleOutlined, CalendarOutlined, EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
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

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false}>
            <Space align="center">
              <AppstoreOutlined className="text-red-500" />
              <Statistic title="Inventory Items" value={stats.inventoryCount} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false}>
            <Space align="center">
              <ExclamationCircleOutlined className="text-yellow-500" />
              <Statistic title="Low Stock" value={stats.lowStock} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false}>
            <Space align="center">
              <CalendarOutlined className="text-blue-500" />
              <Statistic title="Upcoming Camps" value={stats.campCount} />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="My Inventory" className="shadow" bordered={false}>
        <Table rowKey={(r)=>r.id} dataSource={inv} pagination={false} columns={[
          { title: 'Blood Group', dataIndex: 'blood_group', render: (g) => <Tag color="volcano">{g}</Tag> },
          { title: 'Units', dataIndex: 'units_available', render: (u, r) => <span className={u <= r.min_stock_level ? 'text-red-500 font-semibold' : ''}>{u}</span> },
          { title: 'Min Stock', dataIndex: 'min_stock_level' },
        ]} />
      </Card>

      <Card title="My Donation Camps" className="shadow" bordered={false} extra={<Button type="primary" onClick={()=>setOpen(true)}>Create Camp</Button>}>
        <List
          dataSource={camps}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<EnvironmentOutlined className="text-blue-500" />}
                title={<span className="font-semibold">{item.name}</span>}
                description={<span>{item.city} • Starts {item.start_date}</span>}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal 
        title="Create Camp" 
        open={open} 
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        footer={null}
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
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => {
              setOpen(false)
              form.resetFields()
            }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


