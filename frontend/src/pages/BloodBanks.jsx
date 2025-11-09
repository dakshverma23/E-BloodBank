import ListPage from '../components/ListPage'
import { Tag } from 'antd'
import { Link } from 'react-router-dom'
import useMe from '../hooks/useMe'

export default function BloodBanks() {
  const { me } = useMe()
  const columns = [
    { title: 'Name', dataIndex: 'name', render: (v, r) => <Link to={`/bloodbanks/${r.id}`}>{v}</Link> },
    { title: 'City', dataIndex: 'city' },
    { title: 'State', dataIndex: 'state' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'approved' ? 'green' : s === 'pending' ? 'gold' : 'red'}>{s}</Tag> },
  ]

  // Only blood bank users can create/edit blood bank records; donors just browse
  const createFields = me?.user_type === 'bloodbank' ? [
    { name: 'name', label: 'Name', rules: [{ required: true }] },
    { name: 'address', label: 'Address', rules: [{ required: true }] },
    { name: 'city', label: 'City', rules: [{ required: true }] },
    { name: 'state', label: 'State', rules: [{ required: true }] },
    { name: 'pincode', label: 'Pincode', rules: [{ required: true }] },
  ] : []

  return <ListPage title="Blood Banks" columns={columns} endpoint="/api/bloodbank/bloodbanks/" createFields={createFields} />
}


