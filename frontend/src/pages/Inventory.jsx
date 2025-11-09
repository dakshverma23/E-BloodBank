import ListPage from '../components/ListPage'
import { InputNumber, Select } from 'antd'
import useMe from '../hooks/useMe'

export default function Inventory() {
  const { me } = useMe()
  const columns = [
    { title: 'Blood Bank', dataIndex: ['bloodbank', 'name'], render: (_, r) => r.bloodbank?.name || r.bloodbank },
    { title: 'Group', dataIndex: 'blood_group' },
    { title: 'Units', dataIndex: 'units_available' },
    { title: 'Min Stock', dataIndex: 'min_stock_level' },
  ]

  // Auto-assigned on backend for bloodbank users; hide creator for others
  const createFields = me?.user_type === 'bloodbank' ? [
    { name: 'blood_group', label: 'Blood Group', rules: [{ required: true }], input: <Select options={[
      { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
      { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
      { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
    ]} /> },
    { name: 'units_available', label: 'Units Available', rules: [{ required: true }], input: <InputNumber className="w-full" min={0} /> },
    { name: 'min_stock_level', label: 'Min Stock Level', rules: [{ required: true }], input: <InputNumber className="w-full" min={0} /> },
  ] : []

  return <ListPage title="Inventory" columns={columns} endpoint="/api/inventory/inventory/" createFields={createFields} />
}


