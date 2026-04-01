import { Layout, Menu, Dropdown, Button } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import useMe from '../hooks/useMe'
import { isAuthenticated } from '../api/client'
import { motion } from 'framer-motion'
const { Header, Content } = Layout

export default function AppLayout({ children }) {
  const { pathname } = useLocation()
  const { me, loading } = useMe()
  const authenticated = isAuthenticated()

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
        background: 'transparent',
        transition: 'background 0.3s ease',
      }}
    >
      <Header 
        style={{ 
          background: 'rgba(255,255,255,.04)', 
          backdropFilter: 'blur(12px)',
          padding: '0 24px', 
          boxShadow: '0 10px 35px rgba(0,0,0,.28)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,.12)',
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
                color: 'rgba(255,255,255,.92)',
                textDecoration: 'none',
                fontFamily: '"Fraunces", serif',
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
                color: 'rgba(255,255,255,.86)',
                transition: 'all 0.3s ease'
              }}
              theme="light"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {authenticated && me && !loading && (
              <span style={{ color: 'rgba(255,255,255,.68)' }}>{me.username}</span>
            )}
            {!authenticated && (
              <Link to="/login" style={{ color: 'rgba(255,255,255,.7)', marginRight: '8px' }}>Login</Link>
            )}
            {authenticated && (
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,.72)', textDecoration: 'none' }}>
                <Button 
                  type="text" 
                  icon={<UserOutlined />} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: 'rgba(255,255,255,.72)'
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
                  color: 'rgba(255,255,255,.72)'
                }} 
              />
            </Dropdown>
          </div>
        </div>
      </Header>
      <Content style={{ padding: '12px', background: 'transparent', transition: 'background 0.3s ease' }}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
          background: 'transparent', 
          borderRadius: '0', 
          boxShadow: 'none', 
          padding: '0', 
          minHeight: 'calc(100vh - 120px)',
          transition: 'background 0.3s ease'
        }}>
          {children}
        </motion.div>
      </Content>
    </Layout>
  )
}


