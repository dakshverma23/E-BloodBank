import { Link } from 'react-router-dom'
import { Button, Card, Row, Col } from 'antd'
import { BankOutlined, HeartOutlined, CalendarOutlined, TeamOutlined, CheckCircleOutlined, GlobalOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <motion.p className="lux-kicker mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              Modern blood operations
            </motion.p>
            <motion.h1
              className="lux-title text-5xl md:text-7xl leading-[1.03] mb-5"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              e-BloodBank
            </motion.h1>
            <motion.p
              style={{ color: 'rgba(255,255,255,.7)', maxWidth: 620 }}
              className="text-lg md:text-xl mb-9"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              A refined command center for blood banks and donors with real-time inventory, camps, appointments,
              and requests in one fluid experience.
            </motion.p>
            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
              <Link to="/signup"><Button type="primary" size="large">Get Started</Button></Link>
              <Link to="/login"><Button size="large">Login</Button></Link>
            </motion.div>
          </div>

          <motion.div
            className="lg:col-span-5 lux-surface p-6 md:p-7"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                [HeartOutlined, 'Live stock', 'Track blood units by group'],
                [CalendarOutlined, 'Appointments', 'Schedule and approve quickly'],
                [TeamOutlined, 'Camp ops', 'Run registrations at scale'],
                [CheckCircleOutlined, 'Requests', 'Approve and reject with clarity'],
              ].map(([Icon, title, text]) => (
                <div key={title} style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'rgba(255,255,255,.85)' }}>
                    <Icon />
                    <strong>{title}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{text}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4">
          <motion.h2 className="lux-title text-3xl md:text-4xl text-center mb-10" {...fadeUp}>Why e-BloodBank?</motion.h2>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <motion.div {...fadeUp}><Card className="text-center h-full"><GlobalOutlined className="text-5xl text-red-500 mb-4" /><h3 className="text-xl font-semibold mb-2">Web App</h3><p style={{ color: 'rgba(255,255,255,.68)' }}>Built for speed and reliability.</p></Card></motion.div>
            </Col>
            <Col xs={24} md={8}>
              <motion.div {...fadeUp}><Card className="text-center h-full"><CheckCircleOutlined className="text-5xl text-red-500 mb-4" /><h3 className="text-xl font-semibold mb-2">Standards</h3><p style={{ color: 'rgba(255,255,255,.68)' }}>Structured, compliant workflows.</p></Card></motion.div>
            </Col>
            <Col xs={24} md={8}>
              <motion.div {...fadeUp}><Card className="text-center h-full"><BankOutlined className="text-5xl text-red-500 mb-4" /><h3 className="text-xl font-semibold mb-2">Dashboards</h3><p style={{ color: 'rgba(255,255,255,.68)' }}>Decision-ready visual summaries.</p></Card></motion.div>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  )
}

