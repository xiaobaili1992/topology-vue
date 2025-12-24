import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    minify: true, // 使用默认的 esbuild 压缩，体积最小
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'index',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        'vue',
        'element-plus',
        '@svgdotjs/svg.js',
        'dagre',
        'svg-pan-zoom',
      ],
      output: {
        compact: true, // 开启 Rollup 的紧凑模式
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@svgdotjs/svg.js': 'SVG',
          'dagre': 'dagre',
          'svg-pan-zoom': 'svgPanZoom',
        },
        exports: 'named',
      },
    },
  },
});
