import { useEffect, useState } from 'react'
import { Button, Form, Input, Pagination, Space, Table, Modal, message } from 'antd'
import { api } from '../api/client'

export default function ListPage({ title, columns, endpoint, createFields = [], beforeCreate, refreshKey = 0 }) {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  async function fetchData(params = {}) {
    setLoading(true)
    try {
      const { data } = await api.get(endpoint, { params: { page, page_size: pageSize, ...params } })
      setData(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      message.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchData() 
  }, [page, pageSize, refreshKey, endpoint])

  async function handleCreate(values) {
    try {
      // Allow caller to transform/augment values before submit
      let toSubmit = values
      if (typeof beforeCreate === 'function') {
        toSubmit = await beforeCreate(values)
      }
      // Basic date normalization for Dayjs objects
      const normalized = Object.fromEntries(Object.entries(toSubmit).map(([k, v]) => {
        if (v && typeof v === 'object' && typeof v.format === 'function') {
          return [k, v.format('YYYY-MM-DD')]
        }
        return [k, v]
      }))
      await api.post(endpoint, normalized)
      message.success('Created successfully')
      setOpen(false)
      form.resetFields()
      fetchData()
    } catch (e) {
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const fieldErrors = Object.entries(resp).map(([name, val]) => ({
          name,
          errors: [Array.isArray(val) ? val.join(', ') : String(val)],
        }))
        if (fieldErrors.length) form.setFields(fieldErrors)
        message.error('Please correct the highlighted fields')
      } else {
        message.error('Create failed')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        {createFields.length > 0 && (
          <Button type="primary" onClick={() => setOpen(true)}>Create</Button>
        )}
      </div>

      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
      />

      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total}
          onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
          showSizeChanger
        />
      </div>

      <Modal 
        title={`Create ${title}`} 
        open={open} 
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          {createFields.map(field => (
            <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules || []}>
              {field.input || <Input />}
            </Form.Item>
          ))}
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => {
              setOpen(false)
              form.resetFields()
            }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


