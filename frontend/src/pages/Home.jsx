import { Link } from 'react-router-dom'
import { Button, Card, Row, Col, Statistic } from 'antd'
import { BankOutlined, HeartOutlined, CalendarOutlined, TeamOutlined, CheckCircleOutlined, MobileOutlined, GlobalOutlined } from '@ant-design/icons'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">e-BloodBank</h1>
          <p className="text-xl mb-8">An end-to-end Solution for managing Blood Transfusion Center or Storage Unit</p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="large" type="default" className="bg-white text-red-600 hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button size="large" type="default" className="bg-transparent border-white text-white hover:bg-white hover:text-red-600">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why e-BloodBank?</h2>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card className="text-center h-full shadow-lg hover:shadow-xl transition-shadow">
                <GlobalOutlined className="text-5xl text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Web App</h3>
                <p>Web based Blood Bank Management System on open source platform</p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="text-center h-full shadow-lg hover:shadow-xl transition-shadow">
                <CheckCircleOutlined className="text-5xl text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Standards</h3>
                <p>Adheres to NACO, Drug & Cosmetic Act & NABH Guidelines</p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="text-center h-full shadow-lg hover:shadow-xl transition-shadow">
                <BankOutlined className="text-5xl text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
                <p>Different type of dashboards for decision making</p>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Features of App */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features of App</h2>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-md">
                <HeartOutlined className="text-4xl text-red-500 mb-3" />
                <h4 className="font-semibold">Real-time Stock</h4>
                <p className="text-sm text-gray-600">Blood stock availability</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-md">
                <TeamOutlined className="text-4xl text-red-500 mb-3" />
                <h4 className="font-semibold">Request Blood</h4>
                <p className="text-sm text-gray-600">Request with a touch</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-md">
                <CalendarOutlined className="text-4xl text-red-500 mb-3" />
                <h4 className="font-semibold">Donation History</h4>
                <p className="text-sm text-gray-600">Track your donations</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-md">
                <BankOutlined className="text-4xl text-red-500 mb-3" />
                <h4 className="font-semibold">Blood Camps</h4>
                <p className="text-sm text-gray-600">Upcoming camps nearby</p>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Available Modules */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Available Modules</h2>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card title="Donor Management" className="shadow-lg">
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Pre-screening of Applicant</li>
                  <li>Checking Registration parameters</li>
                  <li>Capturing Vital parameters</li>
                  <li>Capture Blood Group (From Analyser)</li>
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Blood Camp Management" className="shadow-lg">
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Camp Registration</li>
                  <li>Allocation Of Number</li>
                  <li>Camp Donor Entry</li>
                  <li>Generate e-Donor Card</li>
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Blood Transfusion" className="shadow-lg">
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Transfusion Request</li>
                  <li>Verification of Blood Sample</li>
                  <li>Crossmatching</li>
                  <li>Issue of Blood</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8">Join our community of blood banks and donors</p>
          <Link to="/signup">
            <Button size="large" type="default" className="bg-white text-red-600 hover:bg-gray-100">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

