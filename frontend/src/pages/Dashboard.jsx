import { Card, Button, Table, Modal, Form, Input, DatePicker, message, Row, Col, Statistic, Tag, List, Skeleton, Space } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PlusOutlined, ExclamationCircleOutlined, EnvironmentOutlined, BankOutlined, TeamOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons'

export default function Dashboard() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inv, setInv] = useState([])
  const [camps, setCamps] = useState([])
  const [stats, setStats] = useState({
    inventoryCount: 0,
    lowStock: 0,
    campCount: 0,
    banksCount: 0,
    myAppointments: 0,
    myRequests: 0,
  })
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const meResp = await api.get('/api/accounts/me/')
        if (!mounted) return
        setMe(meResp.data)
        if (meResp.data.user_type === 'bloodbank') {
          const [invResp, campsResp] = await Promise.all([
            api.get('/api/bloodbank/bloodbanks/my_inventory/'),
            api.get('/api/bloodbank/camps/?mine=true'),
          ])
          if (!mounted) return
          const inventory = invResp.data || []
          const campList = campsResp.data.results || campsResp.data || []
          setInv(inventory)
          setCamps(campList)
          setStats(s => ({
            ...s,
            inventoryCount: inventory.length,
            lowStock: inventory.filter(i => i.units_available <= i.min_stock_level).length,
            campCount: campList.length,
          }))
        } else {
          const [banks, appts, reqs] = await Promise.all([
            api.get('/api/bloodbank/bloodbanks/'),
            api.get('/api/donors/appointments/'),
            api.get('/api/requests/requests/'),
          ])
          if (!mounted) return
          setStats(s => ({
            ...s,
            banksCount: banks.data.count ?? (banks.data.results?.length || banks.data.length || 0),
            myAppointments: appts.data.count ?? (appts.data.results?.length || appts.data.length || 0),
            myRequests: reqs.data.count ?? (reqs.data.results?.length || reqs.data.length || 0),
          }))
        }
      } catch {
        // ignore; UI will show minimal
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function createCamp(values) {
    try {
      const payload = { ...values, start_date: values.start_date?.format('YYYY-MM-DD') }
      await api.post('/api/bloodbank/camps/', payload)
      message.success('Camp created')
      setOpen(false)
      form.resetFields()
      const r = await api.get('/api/bloodbank/camps/?mine=true')
      setCamps(r.data.results || r.data)
    } catch {
      message.error('Failed to create camp')
    }
  }

  if (!me) return <Skeleton active paragraph={{ rows: 6 }} />

  if (me.user_type === 'bloodbank') {
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
          <Table rowKey={(r)=>r.id} dataSource={inv} loading={loading} pagination={false} columns={[
            { title: 'Blood Group', dataIndex: 'blood_group', render: (g) => <Tag color="volcano">{g}</Tag> },
            { title: 'Units', dataIndex: 'units_available', render: (u, r) => <span className={u <= r.min_stock_level ? 'text-red-500 font-semibold' : ''}>{u}</span> },
            { title: 'Min Stock', dataIndex: 'min_stock_level' },
          ]} />
        </Card>

        <Card title="My Donation Camps" className="shadow" bordered={false} extra={<Button type="primary" icon={<PlusOutlined />} onClick={()=>setOpen(true)}>Create Camp</Button>}>
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

        <Modal title="Create Camp" open={open} onCancel={()=>setOpen(false)} onOk={()=>form.submit()} okText="Create">
          <Form layout="vertical" form={form} onFinish={createCamp}>
            <Form.Item name="name" label="Name" rules={[{required:true}]}> <Input placeholder="Community Drive"/> </Form.Item>
            <Form.Item name="address" label="Address" rules={[{required:true}]}> <Input placeholder="123 Main St"/> </Form.Item>
            <Form.Item name="city" label="City" rules={[{required:true}]}> <Input/> </Form.Item>
            <Form.Item name="start_date" label="Start Date" rules={[{required:true}]}> <DatePicker className="w-full"/> </Form.Item>
          </Form>
        </Modal>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Row gutter={[16,16]}>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false}>
            <Space align="center">
              <BankOutlined className="text-red-500" />
              <Statistic title="Blood Banks" value={stats.banksCount} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false}>
            <Space align="center">
              <CalendarOutlined className="text-blue-500" />
              <Statistic title="My Appointments" value={stats.myAppointments} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false}>
            <Space align="center">
              <TeamOutlined className="text-green-600" />
              <Statistic title="My Requests" value={stats.myRequests} />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Quick Actions" className="shadow" bordered={false}>
        <Space wrap>
          <Button type="primary" href="/requests">Request Blood</Button>
          <Button href="/donations">Add Donation</Button>
          <Button href="/bloodbanks">Browse Blood Banks</Button>
        </Space>
      </Card>
    </div>
  )
}


