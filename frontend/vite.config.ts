import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Dış ağlara açar
    port: 5173
  }
});