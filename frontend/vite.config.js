import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'dns'

// Force IPv4 for proxy - Node 17+ resolves localhost to IPv6 (::1), Django listens on IPv4 (127.0.0.1)
dns.setDefaultResultOrder('ipv4first')

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Listen on all interfaces
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})


