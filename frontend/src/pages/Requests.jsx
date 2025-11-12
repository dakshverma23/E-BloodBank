import { Modal, Form, Input, DatePicker, Select, Button, message, InputNumber, Table, Pagination, Tag, Descriptions, Divider } from 'antd'
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'

export default function Requests() {
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [form] = Form.useForm()
  const { me } = useMe()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleViewDetails(record) {
    setSelectedRequest(record)
    setDetailOpen(true)
  }

  async function fetchData() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/requests/requests/', { 
        params: { page, page_size: pageSize } 
      })
      setData(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      message.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, refreshKey])

  const columns = [
    { title: 'Request ID', dataIndex: 'request_id', render: (id) => id || 'N/A' },
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Blood Group', dataIndex: 'blood_group', render: (bg) => <Tag color="volcano">{bg}</Tag> },
    { title: 'Units', dataIndex: 'units_required' },
    { 
      title: 'Urgency', 
      dataIndex: 'urgency',
      render: (urgency) => {
        const colors = { emergency: 'red', urgent: 'orange', normal: 'blue' }
        return <Tag color={colors[urgency]}>{urgency?.toUpperCase()}</Tag>
      }
    },
    { 
      title: 'Status', 
      dataIndex: 'status',
      render: (status) => {
        const colors = { 
          pending: 'orange', 
          approved: 'green', 
          rejected: 'red', 
          fulfilled: 'blue',
          cancelled: 'default'
        }
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>
      }
    },
    ...(me?.user_type === 'bloodbank' ? [{
      title: 'Blood Bank',
      dataIndex: 'bloodbank_name',
      render: (name, record) => {
        if (!name) return <Tag color="default">Unassigned</Tag>
        return <Tag color={record.status === 'approved' ? 'green' : record.status === 'rejected' ? 'red' : 'blue'}>{name}</Tag>
      }
    }] : []),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (me?.user_type === 'bloodbank') {
          return (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleViewDetails(record)
              }}
            >
              View Details
            </Button>
          )
        }
        return null
      }
    }
  ]

  const createFields = []

  async function handleApprove() {
    if (!selectedRequest) return
    
    // Client-side validation
    if (selectedRequest.status === 'approved') {
      message.warning('This request has already been approved by another blood bank and cannot be changed.')
      return
    }
    
    setActionLoading(true)
    try {
      await api.post(`/api/requests/requests/${selectedRequest.id}/approve/`)
      message.success(
        selectedRequest.status === 'rejected' 
          ? 'Request approved successfully (override rejection)' 
          : 'Request approved successfully'
      )
      setDetailOpen(false)
      setSelectedRequest(null)
      setRefreshKey(k => k + 1)
      fetchData()
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.response?.data?.detail || 'Failed to approve request'
      message.error(errorMsg)
      // If error, refresh data to get latest status
      fetchData()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!selectedRequest) return
    
    // Client-side validation
    if (selectedRequest.status === 'approved') {
      message.warning('Cannot reject a request that has already been approved by another blood bank.')
      return
    }
    
    if (selectedRequest.status !== 'pending') {
      message.warning('Can only reject pending requests.')
      return
    }
    
    setActionLoading(true)
    try {
      await api.post(`/api/requests/requests/${selectedRequest.id}/reject/`)
      message.success('Request rejected')
      setDetailOpen(false)
      setSelectedRequest(null)
      setRefreshKey(k => k + 1)
      fetchData()
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.response?.data?.detail || 'Failed to reject request'
      message.error(errorMsg)
      // If error, refresh data to get latest status
      fetchData()
    } finally {
      setActionLoading(false)
    }
  }

  async function submit(values){
    try{
      // Validate required fields
      if (!values.patient_name || !values.patient_name.trim()) {
        form.setFields([{ name: 'patient_name', errors: ['Patient name is required'] }])
        return
      }
      if (!values.blood_group) {
        form.setFields([{ name: 'blood_group', errors: ['Blood group is required'] }])
        return
      }
      if (!values.units_required || values.units_required < 1) {
        form.setFields([{ name: 'units_required', errors: ['Units required must be at least 1'] }])
        return
      }
      if (!values.urgency) {
        form.setFields([{ name: 'urgency', errors: ['Urgency level is required'] }])
        return
      }
      if (!values.required_date) {
        form.setFields([{ name: 'required_date', errors: ['Required date is required'] }])
        return
      }
      if (!values.hospital_name || !values.hospital_name.trim()) {
        form.setFields([{ name: 'hospital_name', errors: ['Hospital name is required'] }])
        return
      }

      const payload = {
        patient_name: values.patient_name.trim(),
        blood_group: values.blood_group,
        units_required: Number(values.units_required),
        urgency: values.urgency,
        required_date: values.required_date.format('YYYY-MM-DD'),
        hospital_name: values.hospital_name.trim(),
        doctor_name: values.doctor_name?.trim() || undefined,
        contact_number: values.contact_number?.trim() || undefined,
        reason: values.reason?.trim() || undefined,
      }
      await api.post('/api/requests/requests/', payload)
      message.success('Request submitted successfully')
      setOpen(false)
      form.resetFields()
      setRefreshKey(k => k + 1) // Trigger list refresh
    }catch(e){
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const fieldErrors = Object.entries(resp).map(([name, val]) => ({
          name,
          errors: [Array.isArray(val) ? val.join(', ') : String(val)],
        }))
        if (fieldErrors.length) form.setFields(fieldErrors)
        message.error('Please correct the highlighted fields')
      } else {
        message.error('Failed to submit request. Please try again.')
      }
    }
  }

  return (
    <div>
      {me?.user_type !== 'bloodbank' && (
        <div className="flex justify-end mb-3">
          <Button type="primary" onClick={()=>setOpen(true)}>Request Blood</Button>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Blood Requests</h1>
      </div>

      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => {
            if (me?.user_type === 'bloodbank') {
              handleViewDetails(record)
            }
          },
          style: { cursor: me?.user_type === 'bloodbank' ? 'pointer' : 'default' }
        })}
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

      {/* Request Detail Modal for Blood Bank */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600 }}>
            <EyeOutlined style={{ color: '#667eea' }} />
            Blood Request Details
          </div>
        }
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setSelectedRequest(null)
        }}
        footer={null}
        width={700}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Request ID">
                <Tag color="blue">{selectedRequest.request_id || 'N/A'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={
                  selectedRequest.status === 'pending' ? 'orange' :
                  selectedRequest.status === 'approved' ? 'green' :
                  selectedRequest.status === 'rejected' ? 'red' : 'blue'
                }>
                  {selectedRequest.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Patient Name">
                <strong>{selectedRequest.patient_name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Blood Group">
                <Tag color="volcano" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {selectedRequest.blood_group}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Units Required">
                <strong style={{ fontSize: '16px', color: '#dc2626' }}>
                  {selectedRequest.units_required}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                <Tag color={
                  selectedRequest.urgency === 'emergency' ? 'red' :
                  selectedRequest.urgency === 'urgent' ? 'orange' : 'blue'
                }>
                  {selectedRequest.urgency?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {selectedRequest.required_date}
              </Descriptions.Item>
              <Descriptions.Item label="Hospital Name">
                {selectedRequest.hospital_name}
              </Descriptions.Item>
              <Descriptions.Item label="Doctor Name">
                {selectedRequest.doctor_name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Number">
                {selectedRequest.contact_number || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                <div style={{ 
                  padding: '8px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {selectedRequest.reason || 'N/A'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Requested By">
                {selectedRequest.requester_username || selectedRequest.requester?.username || selectedRequest.requester || 'N/A'}
              </Descriptions.Item>
              {selectedRequest.bloodbank_name && (
                <Descriptions.Item label="Blood Bank">
                  <Tag color="blue">{selectedRequest.bloodbank_name}</Tag>
                </Descriptions.Item>
              )}
              {selectedRequest.approved_by_username && (
                <Descriptions.Item label={selectedRequest.status === 'approved' ? 'Approved By' : 'Rejected By'}>
                  <strong>{selectedRequest.approved_by_username || selectedRequest.approved_by?.username || 'N/A'}</strong>
                </Descriptions.Item>
              )}
              {selectedRequest.approved_at && (
                <Descriptions.Item label={selectedRequest.status === 'approved' ? 'Approved At' : 'Rejected At'}>
                  {new Date(selectedRequest.approved_at).toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created At">
                {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {me?.user_type === 'bloodbank' && (
              <>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  {/* Reject button - only show for pending requests */}
                  {selectedRequest.status === 'pending' && (
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={handleReject}
                      loading={actionLoading}
                      size="large"
                      style={{ borderRadius: '6px' }}
                    >
                      Reject Request
                    </Button>
                  )}
                  {/* Approve button - show for pending or rejected requests, but not approved */}
                  {selectedRequest.status !== 'approved' && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleApprove}
                      loading={actionLoading}
                      size="large"
                      disabled={selectedRequest.status === 'approved'}
                      style={{
                        background: selectedRequest.status === 'approved' 
                          ? '#d9d9d9' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 500,
                      }}
                    >
                      {selectedRequest.status === 'rejected' ? 'Approve (Override Rejection)' : 'Approve Request'}
                    </Button>
                  )}
                  {/* Show message if already approved by another blood bank */}
                  {selectedRequest.status === 'approved' && (
                    <div style={{ 
                      padding: '12px 16px', 
                      background: '#f6ffed', 
                      border: '1px solid #b7eb8f', 
                      borderRadius: '6px',
                      color: '#52c41a',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircleOutlined />
                      This request has already been approved by another blood bank and cannot be changed.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Create Request Modal for Donors */}
      <Modal 
        title="Request Blood" 
        open={open} 
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        footer={null}
      >
        {me?.user_type === 'bloodbank' ? (
          <div className="text-gray-600">Blood banks cannot create requests.</div>
        ) : (
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item name="patient_name" label="Patient Name" rules={[{required: true, message: 'Please enter patient name'}]}> 
            <Input placeholder="Enter patient name"/> 
          </Form.Item>
          <Form.Item name="blood_group" label="Blood Group" rules={[{required: true, message: 'Please select blood group'}]}> 
            <Select placeholder="Select blood group" options={[
              { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
              { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
              { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
              { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
            ]} /> 
          </Form.Item>
          <Form.Item name="units_required" label="Units Required" rules={[{required: true, message: 'Please enter units required'}]}> 
            <InputNumber className="w-full" min={1} placeholder="Enter units" /> 
          </Form.Item>
          <Form.Item name="urgency" label="Urgency" rules={[{required: true, message: 'Please select urgency level'}]}> 
            <Select placeholder="Select urgency" options={[
              {value:'emergency',label:'Emergency'},{value:'urgent',label:'Urgent'},{value:'normal',label:'Normal'}
            ]} /> 
          </Form.Item>
          <Form.Item name="required_date" label="Required Date" rules={[{required: true, message: 'Please select required date'}]}> 
            <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Select date" /> 
          </Form.Item>
          <Form.Item name="hospital_name" label="Hospital Name" rules={[{required: true, message: 'Please enter hospital name'}]}> 
            <Input placeholder="Enter hospital name"/> 
          </Form.Item>
          <Form.Item name="doctor_name" label="Doctor Name"> 
            <Input placeholder="Enter doctor name (optional)"/> 
          </Form.Item>
          <Form.Item name="contact_number" label="Contact Number"> 
            <Input placeholder="Enter contact number (optional)"/> 
          </Form.Item>
          <Form.Item name="reason" label="Reason"> 
            <Input.TextArea rows={3} placeholder="Enter reason (optional)"/> 
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => {
              setOpen(false)
              form.resetFields()
            }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Submit</Button>
          </div>
        </Form>
        )}
      </Modal>
    </div>
  )
}


