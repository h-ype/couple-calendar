import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,  // 모든 IP에서 접속 가능하도록
    port: 5173,   // 기본 포트, 필요시 바꿔도 됨
  },
})