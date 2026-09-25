import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// Oyun alanı (demo). `--mode singlefile` tek HTML dosyasına gömülü çıktı üretir.
export default defineConfig(({ mode }) => ({
  root: 'playground',
  base: './',
  plugins: [react(), ...(mode === 'singlefile' ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      xbdesk: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  server: { host: '0.0.0.0', port: 5180 },
  build: {
    outDir: mode === 'singlefile' ? '../dist-demo' : '../dist-playground',
    emptyOutDir: true,
  },
}));
