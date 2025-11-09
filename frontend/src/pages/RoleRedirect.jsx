import { Navigate } from 'react-router-dom'
import { Skeleton } from 'antd'
import useMe from '../hooks/useMe'

export default function RoleRedirect() {
  const { me, loading } = useMe()
  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />
  const role = me?.user_type
  if (role === 'bloodbank') return <Navigate to="/dashboard/bloodbank" replace />
  return <Navigate to="/dashboard/donor" replace />
}


