import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        competences: resolve(__dirname, 'src/competences/index.html'),
        projects: resolve(__dirname, 'src/projects/index.html'),
        cv: resolve(__dirname, 'src/cv/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
