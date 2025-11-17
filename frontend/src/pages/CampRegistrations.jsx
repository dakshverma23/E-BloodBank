import { useState, useEffect } from 'react'
import { Table, Pagination, Button, Modal, Descriptions, message, Tag, Card, Typography, Space, Empty } from 'antd'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { useTheme } from '../contexts/ThemeContext'
import { EyeOutlined, TeamOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function CampRegistrations() {
  const { colors } = useTheme()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const { me } = useMe()

  const columns = [
    { title: 'Camp Name', dataIndex: 'camp_name', render: (name) => <Text strong>{name}</Text> },
    { title: 'Blood Bank', dataIndex: 'bloodbank_name', render: (name) => <Tag color="blue">{name}</Tag> },
    { title: 'Full Name', dataIndex: 'full_name', render: (name) => <Text strong>{name}</Text> },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    { 
      title: 'Blood Group', 
      dataIndex: 'blood_group',
      render: (bg) => <Tag color="volcano" style={{ fontSize: '13px', padding: '4px 12px' }}>{bg}</Tag>
    },
    { 
      title: 'Status', 
      dataIndex: 'status',
      render: (status) => {
        const colors = { 
          pending: 'orange', 
          confirmed: 'green', 
          cancelled: 'red', 
          attended: 'blue'
        }
        return <Tag color={colors[status]} style={{ fontSize: '13px', padding: '4px 12px' }}>{status?.toUpperCase()}</Tag>
      }
    },
    { title: 'Registered At', dataIndex: 'registered_at', render: (date) => date ? new Date(date).toLocaleString() : 'N/A' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      )
    }
  ]

  async function fetchData() {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (me?.user_type === 'bloodbank') {
        const campId = new URLSearchParams(window.location.search).get('camp')
        if (campId) {
          params.camp = campId
        }
      }
      const { data } = await api.get('/api/bloodbank/camp-registrations/', { params })
      setData(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      message.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, me])

  function handleViewDetails(record) {
    setSelectedRegistration(record)
    setDetailOpen(true)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TeamOutlined style={{ fontSize: '28px', color: colors.primary }} />
          <div>
            <Title level={2} style={{ margin: 0, color: colors.text }}>Camp Registrations</Title>
            <Text type="secondary" style={{ color: colors.textSecondary }}>View and manage camp registrations</Text>
          </div>
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
          <Empty description="No registrations found" />
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
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} registrations`}
              />
            </div>
          </>
        )}
      </Card>

      {/* Registration Detail Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#667eea' }} />
            <Text strong>Registration Details</Text>
          </Space>
        }
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setSelectedRegistration(null)
        }}
        footer={null}
        width={700}
      >
        {selectedRegistration && (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Camp Name">
              <Text strong>{selectedRegistration.camp_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Blood Bank">
              <Tag color="blue">{selectedRegistration.bloodbank_name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Full Name">
              <Text strong>{selectedRegistration.full_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedRegistration.email}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedRegistration.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Blood Group">
              <Tag color="volcano" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {selectedRegistration.blood_group}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              {selectedRegistration.date_of_birth || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={
                selectedRegistration.status === 'pending' ? 'orange' :
                selectedRegistration.status === 'confirmed' ? 'green' :
                selectedRegistration.status === 'cancelled' ? 'red' : 'blue'
              }>
                {selectedRegistration.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Notes">
              <div style={{ 
                padding: '8px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {selectedRegistration.notes || 'N/A'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Registered At">
              {selectedRegistration.registered_at ? new Date(selectedRegistration.registered_at).toLocaleString() : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
