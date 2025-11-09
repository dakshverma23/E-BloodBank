import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Space, Button, notification } from 'antd'
import { api } from '../api/client'
import { BankOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons'

export default function DonorDashboard() {
  const [stats, setStats] = useState({ banksCount: 0, myAppointments: 0, myRequests: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [banks, appts, reqs, camps] = await Promise.all([
          api.get('/api/bloodbank/bloodbanks/'),
          api.get('/api/donors/appointments/'),
          api.get('/api/requests/requests/'),
          api.get('/api/bloodbank/camps/'),
        ])
        if (!mounted) return
        setStats({
          banksCount: banks.data.count ?? (banks.data.results?.length || banks.data.length || 0),
          myAppointments: appts.data.count ?? (appts.data.results?.length || appts.data.length || 0),
          myRequests: reqs.data.count ?? (reqs.data.results?.length || reqs.data.length || 0),
        })
        // Simple camp announcement notification (once per session if new)
        const campCount = camps.data.count ?? (camps.data.results?.length || camps.data.length || 0)
        const last = parseInt(localStorage.getItem('last_camp_count') || '0', 10)
        if (campCount > last) {
          notification.open({
            message: 'New Blood Donation Camps',
            description: 'New camps have been listed. Visit the Blood Banks page to see details.',
            placement: 'topRight',
          })
        }
        localStorage.setItem('last_camp_count', String(campCount))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-4">
      <Row gutter={[16,16]}>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false} loading={loading}>
            <Space align="center">
              <BankOutlined className="text-red-500" />
              <Statistic title="Blood Banks" value={stats.banksCount} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false} loading={loading}>
            <Space align="center">
              <CalendarOutlined className="text-blue-500" />
              <Statistic title="My Appointments" value={stats.myAppointments} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow" bordered={false} loading={loading}>
            <Space align="center">
              <TeamOutlined className="text-green-600" />
              <Statistic title="My Requests" value={stats.myRequests} />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Quick Actions" className="shadow" bordered={false}>
        <Space wrap>
          <Button type="primary" href="/requests">Request Blood</Button>
          <Button href="/donations">Add Donation</Button>
          <Button href="/bloodbanks">Browse Blood Banks</Button>
        </Space>
      </Card>
    </div>
  )
}


