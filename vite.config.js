import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        root: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'src/index.html'),
        competences: resolve(__dirname, 'src/competences/index.html'),
        projects: resolve(__dirname, 'src/projects/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
