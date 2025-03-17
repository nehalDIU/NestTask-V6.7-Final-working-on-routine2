import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'brotli' as const,
      ext: '.br'
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    // Enable minification and tree shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'date-utils': ['date-fns'],
          'ui-components': ['@radix-ui/react-dialog', 'framer-motion'],
          'supabase': ['@supabase/supabase-js'],
          'icons': ['lucide-react']
        },
        // Ensure proper file types and names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          if (info.endsWith('.css')) {
            return 'assets/css/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    },
    // Enable source map compression
    sourcemap: true,
    // Enable chunk size optimization
    chunkSizeWarningLimit: 1000,
    // Add asset optimization
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    modulePreload: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'date-fns',
      '@radix-ui/react-dialog',
      'framer-motion'
    ],
    exclude: ['lucide-react']
  },
  // Enable caching
  server: {
    hmr: {
      overlay: false
    }
  }
});