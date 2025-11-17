import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Input, Select, Tag, Button, Space, Typography, Skeleton, Empty, message, Tooltip, Divider } from 'antd'
import { 
  SearchOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  BankOutlined,
  IdcardOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import useMe from '../hooks/useMe'
import { useTheme } from '../contexts/ThemeContext'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

export default function BloodBanks() {
  const { me } = useMe()
  const { colors } = useTheme()
  const [bloodBanks, setBloodBanks] = useState([])
  const [filteredBanks, setFilteredBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('approved')
  const [operationalFilter, setOperationalFilter] = useState('true')

  const fetchBloodBanks = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page_size: 1000, // Get all blood banks
        status: statusFilter,
        is_operational: operationalFilter === 'true',
      }

      const { data } = await api.get('/api/bloodbank/bloodbanks/', { params })
      const banks = data.results || data || []
      
      // Filter: Only show approved and operational banks for donors
      const filtered = banks.filter(bank => 
        bank.status === 'approved' && bank.is_operational === true
      )
      
      setBloodBanks(filtered)
      setFilteredBanks(filtered)
    } catch (e) {
      console.error('Failed to load blood banks:', e)
      message.error('Failed to load blood banks')
      setBloodBanks([])
      setFilteredBanks([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, operationalFilter])

  useEffect(() => {
    fetchBloodBanks()
  }, [fetchBloodBanks])

  // Get unique cities and states for filters
  const cities = [...new Set(bloodBanks.map(b => b.city).filter(Boolean))].sort()
  const states = [...new Set(bloodBanks.map(b => b.state).filter(Boolean))].sort()

  // Filter blood banks based on search and filters
  useEffect(() => {
    let filtered = [...bloodBanks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(bank =>
        bank.name?.toLowerCase().includes(query) ||
        bank.city?.toLowerCase().includes(query) ||
        bank.state?.toLowerCase().includes(query) ||
        bank.registration_number?.toLowerCase().includes(query) ||
        bank.address?.toLowerCase().includes(query)
      )
    }

    // City filter
    if (cityFilter) {
      filtered = filtered.filter(bank => bank.city === cityFilter)
    }

    // State filter
    if (stateFilter) {
      filtered = filtered.filter(bank => bank.state === stateFilter)
    }

    setFilteredBanks(filtered)
  }, [searchQuery, cityFilter, stateFilter, bloodBanks])

  const getMapsUrl = (bank) => {
    if (bank.latitude && bank.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`
    }
    return null
  }

  const renderBloodBankCard = (bank) => {
    const mapsUrl = getMapsUrl(bank)
    
    return (
      <Col xs={24} sm={24} md={12} lg={8} key={bank.id}>
        <Card
          hoverable
          style={{
            height: '100%',
            borderRadius: '12px',
            boxShadow: `0 2px 8px ${colors.shadow}`,
            transition: 'all 0.3s ease',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
          }}
          styles={{
            body: { padding: '20px' }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 8px 16px ${colors.shadow}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadow}`
          }}
        >
          {/* Header Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: 0, marginBottom: '4px', color: colors.text }}>
                  <BankOutlined style={{ color: colors.primary, marginRight: '8px' }} />
                  {bank.name || 'N/A'}
                </Title>
                <Space size="small" wrap>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Approved
                  </Tag>
                  {bank.is_operational && (
                    <Tag color="blue">Operational</Tag>
                  )}
                </Space>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Details Section */}
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Registration Number */}
            {bank.registration_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IdcardOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                  <Text type="secondary" style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}>
                    Reg. No: <Text strong style={{ color: colors.text }}>{bank.registration_number}</Text>
                  </Text>
              </div>
            )}

            {/* Location */}
            {(bank.city || bank.state) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <EnvironmentOutlined style={{ color: '#52c41a', fontSize: '16px', marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  {bank.address && (
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px', color: colors.textSecondary }}>
                      {bank.address}
                    </Text>
                  )}
                  <Text type="secondary" style={{ fontSize: '13px', color: colors.textSecondary }}>
                    {[bank.city, bank.state, bank.pincode].filter(Boolean).join(', ')}
                  </Text>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bank.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
                  <Text 
                    type="secondary" 
                    style={{ fontSize: '13px', color: colors.textSecondary }}
                    copyable={{ text: bank.phone, tooltips: ['Copy phone', 'Copied!'] }}
                  >
                    {bank.phone}
                  </Text>
                </div>
              )}
              {bank.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MailOutlined style={{ color: '#eb2f96', fontSize: '16px' }} />
                  <Text 
                    type="secondary" 
                    style={{ fontSize: '13px', color: colors.textSecondary }}
                    copyable={{ text: bank.email, tooltips: ['Copy email', 'Copied!'] }}
                  >
                    {bank.email}
                  </Text>
                </div>
              )}
            </div>

            {/* Operating Hours */}
            {bank.operating_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClockCircleOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
                <Text type="secondary" style={{ fontSize: '13px', color: colors.textSecondary }}>
                  <Text strong style={{ color: colors.text }}>Hours:</Text> {bank.operating_hours}
                </Text>
              </div>
            )}
          </Space>

          {/* Action Buttons */}
          <Divider style={{ margin: '16px 0' }} />
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Link to={`/bloodbanks/${bank.id}`}>
              <Button 
                type="primary" 
                size="small"
                style={{
                  background: colors.gradientButton,
                  border: 'none',
                }}
              >
                View Details
              </Button>
            </Link>
            {mapsUrl && (
              <Button 
                type="default" 
                size="small" 
                icon={<GlobalOutlined />}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                Open Maps
              </Button>
            )}
          </Space>
        </Card>
      </Col>
    )
  }

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 6 }} />
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          {[1, 2, 3].map(i => (
            <Col xs={24} sm={24} md={12} lg={8} key={i}>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <Card
        variant="borderless"
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          background: colors.gradient,
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BankOutlined style={{ fontSize: '28px', color: colors.primary }} />
          <div>
            <Title level={2} style={{ margin: 0, color: colors.text }}>
              Blood Banks Directory
            </Title>
            <Text type="secondary" style={{ color: colors.textSecondary }}>
              Find approved and operational blood banks near you
            </Text>
          </div>
        </div>
      </Card>

      {/* Filters Section */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
        styles={{ body: { padding: '16px' } }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Search
              placeholder="Search by name, city, state, or registration number..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Filter by City"
              style={{ width: '100%' }}
              size="large"
              value={cityFilter || undefined}
              onChange={setCityFilter}
              allowClear
            >
              {cities.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Filter by State"
              style={{ width: '100%' }}
              size="large"
              value={stateFilter || undefined}
              onChange={setStateFilter}
              allowClear
            >
              {states.map(state => (
                <Option key={state} value={state}>{state}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Space wrap>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Showing: <Text strong>{filteredBanks.length}</Text> of <Text strong>{bloodBanks.length}</Text> blood banks
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Blood Banks Grid */}
      {filteredBanks.length === 0 ? (
        <Card 
          style={{ 
            borderRadius: '12px', 
            textAlign: 'center', 
            padding: '40px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 2px 8px ${colors.shadow}`,
          }}
        >
          <Empty
            description={
              <Text type="secondary" style={{ color: colors.textSecondary }}>
                {bloodBanks.length === 0
                  ? 'No blood banks available'
                  : 'No blood banks match your search criteria'}
              </Text>
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredBanks.map(renderBloodBankCard)}
        </Row>
      )}
    </div>
  )
}
