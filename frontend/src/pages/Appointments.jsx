import { useState } from 'react'
import { Button, Modal, Form, DatePicker, Input, Select, message } from 'antd'
import ListPage from '../components/ListPage'
import { api } from '../api/client'
import useMe from '../hooks/useMe'

export default function Appointments() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const { me } = useMe()

  const columns = [
    { title: 'User', dataIndex: ['user', 'username'], render: (_, r) => r.user?.username || r.user },
    { title: 'Blood Bank', dataIndex: ['bloodbank', 'name'], render: (_, r) => r.bloodbank?.name || r.bloodbank },
    { title: 'Date', dataIndex: 'appointment_date' },
    { title: 'Status', dataIndex: 'status' },
  ]

  async function submit(values) {
    try {
      const payload = {
        bloodbank: values.bloodbank,
        appointment_date: values.appointment_date?.format('YYYY-MM-DD'),
        notes: (values.notes || '').trim() || undefined,
      }
      await api.post('/api/donors/appointments/', payload)
      message.success('Appointment created')
      setOpen(false)
      form.resetFields()
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const fieldErrors = Object.entries(resp).map(([name, val]) => ({ name, errors: [Array.isArray(val) ? val.join(', ') : String(val)] }))
        if (fieldErrors.length) form.setFields(fieldErrors)
        message.error('Please correct the highlighted fields')
      } else {
        message.error('Failed to create appointment')
      }
    }
  }

  const createForm = (
    <Form layout="vertical" form={form} onFinish={submit}>
      {/* Let user pick bank by ID for now. Could be improved to a searchable select. */}
      <Form.Item name="bloodbank" label="Blood Bank (ID)" rules={[{ required: true }]}> <Input /> </Form.Item>
      <Form.Item name="appointment_date" label="Appointment Date" rules={[{ required: true }]}> <DatePicker className="w-full" /> </Form.Item>
      <Form.Item name="notes" label="Notes"> <Input.TextArea rows={3} /> </Form.Item>
      <div className="flex justify-end"><Button type="primary" htmlType="submit">Create</Button></div>
    </Form>
  )

  return (
    <div>
      {/* Donors can create their own appointments; banks can only view */}
      {me?.user_type !== 'bloodbank' && (
        <div className="flex justify-end mb-3"><Button type="primary" onClick={() => setOpen(true)}>Create Appointment</Button></div>
      )}
      <ListPage title="Appointments" columns={columns} endpoint="/api/donors/appointments/" createFields={[]} />
      <Modal title="Create Appointment" open={open} onCancel={() => setOpen(false)} footer={null}>
        {me?.user_type === 'bloodbank' ? (
          <div className="text-gray-600">Blood banks cannot create appointments.</div>
        ) : createForm}
      </Modal>
    </div>
  )
}


