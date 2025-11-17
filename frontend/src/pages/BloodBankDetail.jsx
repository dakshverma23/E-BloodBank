import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Skeleton, Space, Button, Tag, Typography, Row, Col, Divider } from 'antd'
import { 
  BankOutlined, 
  IdcardOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { api } from '../api/client'
import { useTheme } from '../contexts/ThemeContext'

const { Title, Text } = Typography

export default function BloodBankDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { colors } = useTheme()
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
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/bloodbanks')}
          style={{ marginBottom: '16px', paddingLeft: 0 }}
        >
          Back to Blood Banks
        </Button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px', color: colors.text }}>
              <BankOutlined style={{ color: colors.primary, marginRight: '12px' }} />
              {data.name}
            </Title>
            <Space size="middle" wrap>
              <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: '13px', padding: '4px 12px' }}>
                Approved
              </Tag>
              {data.is_operational && (
                <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
                  Operational
                </Tag>
              )}
            </Space>
          </div>
          {mapsUrl && (
            <Button 
              type="primary" 
              icon={<GlobalOutlined />}
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: colors.gradientButton,
                border: 'none',
                borderRadius: '8px',
                height: '40px',
                padding: '0 24px',
                fontWeight: 500,
              }}
            >
              Open in Maps
            </Button>
          )}
        </div>
      </div>

      {/* Details Card */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item 
                label={
                  <Space>
                    <IdcardOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Registration Number</Text>
                  </Space>
                }
              >
                <Text copyable={{ text: data.registration_number }}>
                  {data.registration_number}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={
                  <Space>
                    <PhoneOutlined style={{ color: '#fa8c16' }} />
                    <Text strong>Phone</Text>
                  </Space>
                }
              >
                {data.phone ? (
                  <Text copyable={{ text: data.phone }}>
                    {data.phone}
                  </Text>
                ) : (
                  <Text type="secondary">Not provided</Text>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={
                  <Space>
                    <MailOutlined style={{ color: '#eb2f96' }} />
                    <Text strong>Email</Text>
                  </Space>
                }
              >
                {data.email ? (
                  <Text copyable={{ text: data.email }}>
                    {data.email}
                  </Text>
                ) : (
                  <Text type="secondary">Not provided</Text>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={
                  <Space>
                    <ClockCircleOutlined style={{ color: '#722ed1' }} />
                    <Text strong>Operating Hours</Text>
                  </Space>
                }
              >
                <Text>{data.operating_hours || '24/7'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          
          <Col xs={24} lg={12}>
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item 
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: '#52c41a' }} />
                    <Text strong>Address</Text>
                  </Space>
                }
              >
                {data.address ? (
                  <Text>{data.address}</Text>
                ) : (
                  <Text type="secondary">Not provided</Text>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label={<Text strong>City</Text>}>
                <Text>{data.city || 'Not provided'}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={<Text strong>State</Text>}>
                <Text>{data.state || 'Not provided'}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={<Text strong>Pincode</Text>}>
                <Text>{data.pincode || 'Not provided'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
