import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'

function mockBackendPlugin() {
  let child = null
  let restartTimer = null
  const py = 'C:\\Users\\admin\\OneDrive\\Desktop\\worker-committee-app\\backend\\venv\\Scripts\\python.exe'
  const cwd = 'C:\\Users\\admin\\OneDrive\\Desktop\\worker-committee-app\\backend'

  function start() {
    child = spawn(py, ['-m', 'uvicorn', 'mock_server:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd,
      stdio: 'inherit',
    })
    child.on('exit', () => {
      child = null
      restartTimer = setTimeout(start, 3000)
    })
  }

  return {
    name: 'mock-backend',
    configureServer(server) {
      start()
      server.httpServer?.on('close', () => {
        clearTimeout(restartTimer)
        child?.kill()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mockBackendPlugin()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: { outDir: 'dist' }
})
