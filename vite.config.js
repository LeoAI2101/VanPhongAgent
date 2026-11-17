import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHub } from './server/hub.js'

// Gắn server nhận sự kiện agent vào chính server của Vite → chỉ cần `npm run dev`
function agentHub() {
  const setup = (server) => {
    const hub = createHub()
    server.middlewares.use(hub.middleware)
    hub.attach(server.httpServer)
  }
  return { name: 'agent-hub', configureServer: setup, configurePreviewServer: setup }
}

export default defineConfig({
  plugins: [react(), agentHub()],
  // Cố định cổng 5173 để hook của agent luôn biết gửi về đâu
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
})
