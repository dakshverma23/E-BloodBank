import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, InputNumber, Select, message, Pagination, Typography, Space, Empty, Tag, Progress } from 'antd'
import { PlusOutlined, DropboxOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { useTheme } from '../contexts/ThemeContext'

const { Title, Text } = Typography

export default function Inventory() {
  const { me } = useMe()
  const { colors } = useTheme()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { 
      title: 'Blood Group', 
      dataIndex: 'blood_group',
      render: (bg) => (
        <Tag color="volcano" style={{ fontSize: '13px', padding: '4px 12px' }}>
          {bg}
        </Tag>
      )
    },
    { 
      title: 'Units Available', 
      dataIndex: 'units_available',
      render: (units, record) => {
        const isLow = units <= record.min_stock_level
        return (
          <Space>
            <Text strong style={{ color: isLow ? '#ff4d4f' : '#52c41a', fontSize: '15px' }}>
              {units}
            </Text>
            {isLow && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        )
      }
    },
    { 
      title: 'Min Stock Level', 
      dataIndex: 'min_stock_level',
      render: (min) => <Text>{min}</Text>
    },
    {
      title: 'Stock Status',
      key: 'stock_status',
      render: (_, record) => {
        const percentage = record.min_stock_level > 0 
          ? Math.min((record.units_available / (record.min_stock_level * 2)) * 100, 100) 
          : 100
        const isLow = record.units_available <= record.min_stock_level
        return (
          <Progress
            percent={percentage}
            size="small"
            strokeColor={isLow ? '#ff4d4f' : '#52c41a'}
            showInfo={false}
          />
        )
      }
    },
  ]

  useEffect(() => {
    fetchData()
  }, [page, pageSize])

  async function fetchData() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/inventory/inventory/', {
        params: { page, page_size: pageSize }
      })
      setData(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      message.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(values) {
    try {
      const payload = {
        blood_group: values.blood_group,
        units_available: Number(values.units_available),
        min_stock_level: Number(values.min_stock_level),
      }
      await api.post('/api/inventory/inventory/', payload)
      message.success('Inventory item created successfully')
      setOpen(false)
      form.resetFields()
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
        message.error('Failed to create inventory item')
      }
    }
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <Card
        variant="borderless"
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          background: colors.gradient,
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DropboxOutlined style={{ fontSize: '28px', color: colors.primary }} />
            <div>
              <Title level={2} style={{ margin: 0, color: colors.text }}>Inventory</Title>
              <Text type="secondary" style={{ color: colors.textSecondary }}>Manage blood inventory and stock levels</Text>
            </div>
          </div>
          {me?.user_type === 'bloodbank' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
              size="large"
              style={{
                background: colors.gradientButton,
                border: 'none',
                borderRadius: '8px',
                height: '40px',
                padding: '0 24px',
                fontWeight: 500,
              }}
            >
              Add Inventory
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
        styles={{ body: { padding: '24px' } }}
      >
        {data.length === 0 && !loading ? (
          <Empty description="No inventory items found" />
        ) : (
          <>
            <Table
              rowKey={(r) => r.id}
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={false}
            />
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
                showSizeChanger
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              />
            </div>
          </>
        )}
      </Card>

      {/* Create Modal */}
      {me?.user_type === 'bloodbank' && (
        <Modal
          title={
            <Space>
              <DropboxOutlined style={{ color: '#667eea' }} />
              <Text strong>Add Inventory Item</Text>
            </Space>
          }
          open={open}
          onCancel={() => {
            setOpen(false)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form layout="vertical" form={form} onFinish={handleCreate}>
            <Form.Item
              name="blood_group"
              label="Blood Group"
              rules={[{ required: true, message: 'Please select blood group' }]}
            >
              <Select
                placeholder="Select blood group"
                size="large"
                options={[
                  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="units_available"
              label="Units Available"
              rules={[{ required: true, message: 'Please enter units available' }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="Enter units available"
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="min_stock_level"
              label="Min Stock Level"
              rules={[{ required: true, message: 'Please enter minimum stock level' }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="Enter minimum stock level"
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <Button onClick={() => {
                setOpen(false)
                form.resetFields()
              }} size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                style={{
                  background: colors.gradientButton,
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                }}
              >
                Create
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  )
}
