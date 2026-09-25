import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Kütüphane derlemesi: dist/deskui.{js,cjs} + dist/style.css
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DeskUI',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'deskui.js' : 'deskui.cjs'),
      cssFileName: 'style',
    },
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    },
  },
});
