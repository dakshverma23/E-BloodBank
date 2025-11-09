import ListPage from '../components/ListPage'
import { DatePicker, Input, InputNumber, Select } from 'antd'

export default function Donors() {
  const columns = [
    { title: 'Name', dataIndex: 'full_name' },
    { title: 'Blood Group', dataIndex: 'blood_group' },
    { title: 'City', dataIndex: 'city' },
    { title: 'Eligible', dataIndex: 'is_eligible', render: (v) => (v ? 'Yes' : 'No') },
  ]

  const createFields = [
    { name: 'full_name', label: 'Full Name', rules: [{ required: true }] },
    { name: 'blood_group', label: 'Blood Group', rules: [{ required: true }], input: <Select options={[
      { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
      { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
      { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
    ]} /> },
    { name: 'date_of_birth', label: 'Date of Birth', rules: [{ required: true }], input: <DatePicker className="w-full" /> },
    { name: 'gender', label: 'Gender', rules: [{ required: true }], input: <Select options={[{value:'M',label:'Male'},{value:'F',label:'Female'},{value:'O',label:'Other'}]} /> },
    { name: 'phone', label: 'Phone', rules: [{ required: true }] },
    { name: 'email', label: 'Email', rules: [{ required: true }] },
    { name: 'address', label: 'Address', rules: [{ required: true }], input: <Input.TextArea rows={2} /> },
    { name: 'city', label: 'City', rules: [{ required: true }] },
    { name: 'state', label: 'State', rules: [{ required: true }] },
    { name: 'pincode', label: 'Pincode', rules: [{ required: true }] },
    { name: 'weight', label: 'Weight (kg)', rules: [{ required: true }], input: <InputNumber className="w-full" min={0} step={0.1} /> },
    { name: 'last_donation_date', label: 'Last Donation Date', input: <DatePicker className="w-full" /> },
    { name: 'is_eligible', label: 'Eligible', input: <Select options={[{value:true,label:'Yes'},{value:false,label:'No'}]} /> },
    { name: 'medical_conditions', label: 'Medical Conditions' },
    { name: 'emergency_contact', label: 'Emergency Contact', rules: [{ required: true }] },
  ]

  return <ListPage title="Donors" columns={columns} endpoint="/api/donors/donors/" createFields={createFields} />
}


