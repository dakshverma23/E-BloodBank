import ListPage from '../components/ListPage'
import { Modal, Form, Input, DatePicker, Select, Button, message, InputNumber } from 'antd'
import { useState } from 'react'
import { api } from '../api/client'
import useMe from '../hooks/useMe'

export default function Requests() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const { me } = useMe()
  const columns = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Blood Group', dataIndex: 'blood_group' },
    { title: 'Units', dataIndex: 'units_required' },
    { title: 'Urgency', dataIndex: 'urgency' },
    { title: 'Status', dataIndex: 'status' },
  ]

  const createFields = []

  const [refreshKey, setRefreshKey] = useState(0)

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
        <div className="flex justify-end mb-3"><Button type="primary" onClick={()=>setOpen(true)}>Request Blood</Button></div>
      )}
      <ListPage title="Requests" columns={columns} endpoint="/api/requests/requests/" createFields={createFields} refreshKey={refreshKey} />
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


