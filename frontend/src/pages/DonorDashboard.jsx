import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Space, Button, notification } from 'antd'
import { api } from '../api/client'
import { BankOutlined, CalendarOutlined, TeamOutlined, HeartOutlined, ThunderboltOutlined, GlobalOutlined } from '@ant-design/icons'

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

  const statCards = [
    {
      title: 'Blood Banks',
      value: stats.banksCount,
      icon: <BankOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      iconBg: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'My Appointments',
      value: stats.myAppointments,
      icon: <CalendarOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      iconBg: 'rgba(79, 172, 254, 0.1)',
    },
    {
      title: 'My Requests',
      value: stats.myRequests,
      icon: <ThunderboltOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      iconBg: 'rgba(245, 87, 108, 0.1)',
    },
  ]

  const quickActions = [
    {
      title: 'Request Blood',
      icon: <HeartOutlined />,
      href: '/requests',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: 'My Donations',
      icon: <TeamOutlined />,
      href: '/donations',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    },
    {
      title: 'Browse Banks',
      icon: <GlobalOutlined />,
      href: '/bloodbanks',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
    {
      title: 'Donation Camps',
      icon: <CalendarOutlined />,
      href: '/camps',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    },
  ]

  return (
    <div style={{ padding: '8px 0' }}>
      <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
        {statCards.map((stat, idx) => (
          <Col xs={24} sm={12} md={8} key={idx}>
            <Card
              bordered={false}
              loading={loading}
              style={{
                background: stat.gradient,
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
              }}
              bodyStyle={{ padding: '20px' }}
              hoverable
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}>
                    {stat.title}
                  </div>
                  <Statistic
                    value={stat.value}
                    valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: stat.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#fff',
                }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThunderboltOutlined style={{ color: '#667eea', fontSize: '20px' }} />
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Quick Actions</span>
          </div>
        }
        bordered={false}
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Row gutter={[12, 12]}>
          {quickActions.map((action, idx) => (
            <Col xs={24} sm={12} md={8} key={idx}>
              <a href={action.href} style={{ textDecoration: 'none' }}>
                <Card
                  bordered={false}
                  style={{
                    background: action.gradient,
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  bodyStyle={{ padding: '24px', textAlign: 'center' }}
                  hoverable
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontSize: '32px', color: '#fff', marginBottom: '12px' }}>
                    {action.icon}
                  </div>
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}>
                    {action.title}
                  </div>
                </Card>
              </a>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}


