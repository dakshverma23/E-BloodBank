import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Descriptions, Skeleton, Space, Button } from 'antd'
import { api } from '../api/client'

export default function BloodBankDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api.get(`/api/bloodbank/bloodbanks/${id}/`).then(({ data }) => {
      if (mounted) setData(data)
    }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />
  if (!data) return <Card>Not found</Card>

  const mapsUrl = data.latitude && data.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
    : null

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <Space>
          <Link to="/bloodbanks"><Button>Back</Button></Link>
          {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer"><Button type="primary">Open in Maps</Button></a>}
        </Space>
      </div>
      <Card>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Registration #">{data.registration_number}</Descriptions.Item>
          <Descriptions.Item label="Email">{data.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{data.phone}</Descriptions.Item>
          <Descriptions.Item label="Address">{data.address}</Descriptions.Item>
          <Descriptions.Item label="City">{data.city}</Descriptions.Item>
          <Descriptions.Item label="State">{data.state}</Descriptions.Item>
          <Descriptions.Item label="Pincode">{data.pincode}</Descriptions.Item>
          <Descriptions.Item label="Status">{data.status}</Descriptions.Item>
          <Descriptions.Item label="Operational">{data.is_operational ? 'Yes' : 'No'}</Descriptions.Item>
          <Descriptions.Item label="Operating Hours">{data.operating_hours}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  )
}


