import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Kütüphane derlemesi: dist/xbdesk.{js,cjs}, dist/react-router.{js,cjs} + dist/style.css.
// Ortak kod ayrı bir parçaya (chunk) düşer; iki giriş aynı context örneğini paylaşır.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        xbdesk: 'src/index.ts',
        'react-router': 'src/adapters/react-router.tsx',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'style',
    },
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'react-router-dom'],
    },
  },
});
