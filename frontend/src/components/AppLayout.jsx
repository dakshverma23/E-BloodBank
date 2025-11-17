import { Layout, Menu, Dropdown, Button, Switch } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserOutlined, LogoutOutlined, MenuOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons'
import useMe from '../hooks/useMe'
import { isAuthenticated } from '../api/client'
import { useTheme } from '../contexts/ThemeContext'
const { Header, Content } = Layout

export default function AppLayout({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { me, loading } = useMe()
  const authenticated = isAuthenticated()
  const { isDarkMode, toggleTheme, colors } = useTheme()

  const menuItems = authenticated && !loading ? (
    me?.user_type === 'bloodbank' ? [
      { key: '/dashboard/bloodbank', label: <Link to="/dashboard/bloodbank">Dashboard</Link> },
      { key: '/donations', label: <Link to="/donations">Transactions</Link> },
      { key: '/inventory', label: <Link to="/inventory">Inventory</Link> },
      { key: '/requests', label: <Link to="/requests">Requests</Link> },
      { key: '/appointments', label: <Link to="/appointments">Appointments</Link> },
      { key: '/camp-registrations', label: <Link to="/camp-registrations">Camp Registrations</Link> },
      { key: '/profile', label: <Link to="/profile">Profile</Link> },
    ] : [
      { key: '/dashboard/donor', label: <Link to="/dashboard/donor">Dashboard</Link> },
      { key: '/bloodbanks', label: <Link to="/bloodbanks">Blood Banks</Link> },
      { key: '/camps', label: <Link to="/camps">Camps</Link> },
      { key: '/donations', label: <Link to="/donations">Donations</Link> },
      { key: '/requests', label: <Link to="/requests">Requests</Link> },
      { key: '/appointments', label: <Link to="/appointments">Appointments</Link> },
      { key: '/profile', label: <Link to="/profile">Profile</Link> },
    ]
  ) : []

  const userMenuItems = authenticated ? [
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
    <Layout 
      style={{ 
        minHeight: '100vh', 
        background: isDarkMode 
          ? 'linear-gradient(to bottom, #0f172a, #1e293b)' 
          : 'linear-gradient(to bottom, #f0f2f5, #ffffff)',
        transition: 'background 0.3s ease'
      }}
    >
      <Header 
        style={{ 
          background: colors.surface, 
          padding: '0 24px', 
          boxShadow: `0 2px 8px ${colors.shadow}`, 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000,
          borderBottom: `1px solid ${colors.border}`,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link 
              to="/" 
              style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: isDarkMode ? '#f87171' : '#dc2626', 
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
            >
              e-BloodBank
            </Link>
            <Menu
              mode="horizontal"
              selectedKeys={[pathname]}
              items={menuItems}
              style={{ 
                border: 'none', 
                flex: 1, 
                lineHeight: '64px',
                background: 'transparent',
                color: colors.text,
                transition: 'all 0.3s ease'
              }}
              theme={isDarkMode ? 'dark' : 'light'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle */}
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              style={{
                background: isDarkMode ? colors.primary : '#d9d9d9'
              }}
            />
            {authenticated && me && !loading && (
              <span style={{ color: colors.textSecondary }}>{me.username}</span>
            )}
            {!authenticated && (
              <Link to="/login" style={{ color: colors.textSecondary, marginRight: '8px' }}>Login</Link>
            )}
            {authenticated && (
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', color: colors.textSecondary, textDecoration: 'none' }}>
                <Button 
                  type="text" 
                  icon={<UserOutlined />} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: colors.textSecondary
                  }} 
                />
              </Link>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button 
                type="text" 
                icon={<MenuOutlined />} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: colors.textSecondary
                }} 
              />
            </Dropdown>
          </div>
        </div>
      </Header>
      <Content style={{ padding: '12px', background: 'transparent', transition: 'background 0.3s ease' }}>
        <div style={{ 
          background: 'transparent', 
          borderRadius: '0', 
          boxShadow: 'none', 
          padding: '0', 
          minHeight: 'calc(100vh - 120px)',
          transition: 'background 0.3s ease'
        }}>
          {children}
        </div>
      </Content>
    </Layout>
  )
}


