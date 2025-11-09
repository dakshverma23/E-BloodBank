import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const api = axios.create({ baseURL })

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const url = (config.url || '').toString()
  const isAuthOrSignup = url.includes('/api/auth/') || url.includes('/api/accounts/signup/')
  const token = localStorage.getItem('access_token')
  if (token && !isAuthOrSignup) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error.config

    // If error is not 401, or it's an auth endpoint, or we've already retried, reject
    if (error?.response?.status !== 401 || 
        originalRequest.url?.includes('/api/auth/') || 
        originalRequest.url?.includes('/api/accounts/signup/') ||
        originalRequest._retry) {
      // Only redirect to login if we're on a protected route
      if (error?.response?.status === 401 && typeof window !== 'undefined') {
        const publicRoutes = ['/', '/home', '/login', '/signup']
        if (!publicRoutes.includes(window.location.pathname)) {
          clearTokens()
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch(err => {
          return Promise.reject(err)
        })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')
    
    if (!refreshToken) {
      clearTokens()
      processQueue(new Error('No refresh token'), null)
      // Only redirect if not on a public route
      if (typeof window !== 'undefined') {
        const publicRoutes = ['/', '/home', '/login', '/signup']
        if (!publicRoutes.includes(window.location.pathname)) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${baseURL}/api/auth/refresh/`, {
        refresh: refreshToken
      })
      
      const { access } = data
      setTokens({ access, refresh: refreshToken })
      
      originalRequest.headers.Authorization = `Bearer ${access}`
      processQueue(null, access)
      
      return api(originalRequest)
    } catch (refreshError) {
      clearTokens()
      processQueue(refreshError, null)
      // Only redirect if not on a public route
      if (typeof window !== 'undefined') {
        const publicRoutes = ['/', '/home', '/login', '/signup']
        if (!publicRoutes.includes(window.location.pathname)) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function getAccessToken() {
  return localStorage.getItem('access_token')
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

export function isAuthenticated() {
  return !!getAccessToken()
}


