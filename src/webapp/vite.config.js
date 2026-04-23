import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Blockchain Dashboard',
        short_name: 'BC Dashboard',
        description: 'Real-time blockchain monitoring dashboard',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'coin-gecko-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.thegraph\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'thegraph-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 300
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/eth\.llamarpc\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rpc-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-charts': ['lightweight-charts'],
          'vendor-i18n': ['vue-i18n']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 500,
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'esbuild',
    target: 'esnext'
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'lightweight-charts']
  }
})
