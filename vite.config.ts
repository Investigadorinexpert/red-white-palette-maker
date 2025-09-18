import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8000'
  return {
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 8080),
      allowedHosts: ['host.docker.internal', '75.119.157.31'],
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean) as any,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
