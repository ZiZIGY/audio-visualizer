import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AudioVisualizer',
      fileName: (format) => `audio-visualizer.${format}.js`,
    },
    rollupOptions: {
      // Убедимся, что внешние зависимости не включены в сборку
      external: [],
      output: {
        // Глобальные переменные для UMD сборки
        globals: {},
      },
    },
  },
});
