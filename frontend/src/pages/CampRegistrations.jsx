import { useState, useEffect } from 'react'
import { Table, Pagination, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Descriptions, Space } from 'antd'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { EyeOutlined } from '@ant-design/icons'

export default function CampRegistrations() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const { me } = useMe()

  const columns = [
    { title: 'Camp Name', dataIndex: 'camp_name', render: (name) => <strong>{name}</strong> },
    { title: 'Blood Bank', dataIndex: 'bloodbank_name', render: (name) => <Tag color="blue">{name}</Tag> },
    { title: 'Full Name', dataIndex: 'full_name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    { 
      title: 'Blood Group', 
      dataIndex: 'blood_group',
      render: (bg) => <Tag color="volcano">{bg}</Tag>
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
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>
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
          View Details
        </Button>
      )
    }
  ]

  async function fetchData() {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      // Blood banks can filter by camp
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Camp Registrations</h1>
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

      {/* Registration Detail Modal */}
      <Modal
        title="Registration Details"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setSelectedRegistration(null)
        }}
        footer={null}
        width={700}
      >
        {selectedRegistration && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Camp Name">
              <strong>{selectedRegistration.camp_name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Blood Bank">
              <Tag color="blue">{selectedRegistration.bloodbank_name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Full Name">
              <strong>{selectedRegistration.full_name}</strong>
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

