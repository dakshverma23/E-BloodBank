import { Layout, Menu, Dropdown, Button } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import useMe from '../hooks/useMe'
import { isAuthenticated } from '../api/client'
const { Header, Content } = Layout

export default function AppLayout({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { me, loading } = useMe()
  const authenticated = isAuthenticated()

  const menuItems = authenticated && !loading ? (
    me?.user_type === 'bloodbank' ? [
      { key: '/dashboard/bloodbank', label: <Link to="/dashboard/bloodbank">Dashboard</Link> },
      { key: '/donations', label: <Link to="/donations">Transactions</Link> },
      { key: '/inventory', label: <Link to="/inventory">Inventory</Link> },
      { key: '/requests', label: <Link to="/requests">Requests</Link> },
      { key: '/profile', label: <Link to="/profile">Profile</Link> },
    ] : [
      { key: '/dashboard/donor', label: <Link to="/dashboard/donor">Dashboard</Link> },
      { key: '/bloodbanks', label: <Link to="/bloodbanks">Blood Banks</Link> },
      { key: '/donations', label: <Link to="/donations">Donations</Link> },
      { key: '/requests', label: <Link to="/requests">Requests</Link> },
      { key: '/appointments', label: <Link to="/appointments">Appointments</Link> },
      { key: '/profile', label: <Link to="/profile">Profile</Link> },
    ]
  ) : []

  const userMenuItems = authenticated ? [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <Link to="/logout">Logout</Link>,
    },
  ] : [
    {
      key: 'login',
      icon: <UserOutlined />,
      label: <Link to="/login">Login</Link>,
    },
    {
      key: 'signup',
      icon: <UserOutlined />,
      label: <Link to="/signup">Signup</Link>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f0f2f5, #ffffff)' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', textDecoration: 'none' }}>
              e-BloodBank
            </Link>
            <Menu
              mode="horizontal"
              selectedKeys={[pathname]}
              items={menuItems}
              style={{ border: 'none', flex: 1, lineHeight: '64px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {authenticated && me && !loading && (
              <span style={{ color: '#666' }}>{me.username}</span>
            )}
            {!authenticated && (
              <Link to="/login" style={{ color: '#666', marginRight: '8px' }}>Login</Link>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />} style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined />
              </Button>
            </Dropdown>
          </div>
        </div>
      </Header>
      <Content style={{ padding: '24px', background: 'transparent' }}>
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', minHeight: 'calc(100vh - 120px)' }}>
          {children}
        </div>
      </Content>
    </Layout>
  )
}


