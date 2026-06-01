import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base:'./' — WPS 加载项以本地文件/任意路径加载，需相对资源路径。
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // 前端只认 /api，开发期由 Vite 转发到 BFF(3000) 并剥掉前缀，规避跨域。
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
