import { useEffect, useState, useCallback, useRef } from 'react'
import { Button, Form, Input, Pagination, Space, Table, Modal, message } from 'antd'
import { api } from '../api/client'

export default function ListPage({ title, columns, endpoint, createFields = [], beforeCreate, refreshKey = 0, customCreateForm: CustomCreateForm }) {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const fetchDataRef = useRef(null)

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await api.get(endpoint, { params: { page, page_size: pageSize, ...params } })
      setData(data.results || data)
      setTotal(data.count || (data.results ? data.results.length : data.length))
    } catch (e) {
      console.error('Failed to load data:', e)
      message.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, pageSize])

  // Store fetchData in ref so it can be accessed
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  useEffect(() => { 
    if (fetchDataRef.current) {
      fetchDataRef.current() 
    }
  }, [page, pageSize, refreshKey, endpoint])

  async function handleCreate(values) {
    try {
      // Allow caller to transform/augment values before submit
      let toSubmit = values
      if (typeof beforeCreate === 'function') {
        try {
          toSubmit = await beforeCreate(values)
          // If beforeCreate returns null/undefined or throws, don't proceed
          if (!toSubmit) {
            return
          }
        } catch (e) {
          // If beforeCreate throws an error, display it and stop
          if (e.message) {
            const errorMsg = e.message
            // Check if it's a validation error that should set form fields
            if (errorMsg.includes('required') || errorMsg.includes('Invalid')) {
              // Try to extract field name from error message
              const fieldMatch = errorMsg.match(/(\w+)\s+is\s+required/i)
              if (fieldMatch) {
                const fieldName = fieldMatch[1].toLowerCase().replace(/\s+/g, '_')
                form.setFields([{ name: fieldName, errors: [errorMsg] }])
              }
            }
            // Don't show generic error if it's already been shown
            if (!errorMsg.includes('User ID') && !errorMsg.includes('Donation date') && !errorMsg.includes('Units')) {
              message.error(errorMsg)
            }
          }
          return // Stop form submission
        }
      }
      
      // Basic date normalization for Dayjs objects
      const normalized = Object.fromEntries(Object.entries(toSubmit).map(([k, v]) => {
        if (v === null || v === undefined) {
          return [k, v]
        }
        // Handle Dayjs objects
        if (typeof v === 'object' && typeof v.format === 'function') {
          return [k, v.format('YYYY-MM-DD')]
        }
        // Handle numbers
        if (typeof v === 'number') {
          return [k, v]
        }
        // Handle strings - trim whitespace
        if (typeof v === 'string') {
          return [k, v.trim() || undefined]
        }
        return [k, v]
      }))
      
      // Remove only undefined values, keep empty strings for optional fields
      // But remove empty strings that might cause validation issues
      Object.keys(normalized).forEach(key => {
        if (normalized[key] === undefined) {
          delete normalized[key]
        }
        // Remove empty strings only for optional fields (like notes)
        // Keep empty strings for required fields - backend will validate
      })
      
      await api.post(endpoint, normalized)
      message.success('Created successfully')
      setOpen(false)
      form.resetFields()
      // Force refresh data after successful creation - use the ref directly
      if (fetchDataRef.current) {
        await fetchDataRef.current()
      } else {
        // Fallback to calling fetchData directly
        await fetchData()
      }
    } catch (e) {
      // Handle API errors
      const resp = e?.response?.data
      if (resp && typeof resp === 'object') {
        const fieldErrors = Object.entries(resp).map(([name, val]) => {
          // Handle nested error structures
          const errorMsg = Array.isArray(val) ? val.join(', ') : String(val)
          return {
            name,
            errors: [errorMsg],
          }
        }).filter(err => err.errors[0]) // Filter out empty errors
        
        if (fieldErrors.length) {
          form.setFields(fieldErrors)
          // Show specific error messages
          const firstError = fieldErrors[0]
          message.error(`${firstError.name}: ${firstError.errors[0]}`)
        } else {
          message.error('Please correct the highlighted fields')
        }
      } else if (e.message && !e.message.includes('User ID') && !e.message.includes('Donation date')) {
        // Don't duplicate error messages
        message.error(e.message || 'Create failed')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        {(createFields.length > 0 || CustomCreateForm) && (
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
        width={600}
      >
        {CustomCreateForm ? (
          <CustomCreateForm 
            form={form} 
            onFinish={handleCreate} 
            onCancel={() => {
              setOpen(false)
              form.resetFields()
            }}
          />
        ) : (
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
        )}
      </Modal>
    </div>
  )
}


