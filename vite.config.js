import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- 关键！把绝对路径改为相对路径，解决白屏/空屏问题
  build: {
    outDir: 'dist',
    assetsDir: '.', // 把资源直接放在根目录，避免复杂的路径查找
  }
})