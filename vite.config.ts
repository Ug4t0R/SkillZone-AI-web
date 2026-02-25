import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 1336,
      host: '0.0.0.0',
      proxy: {
        '/api/serpapi': {
          target: 'https://serpapi.com',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/serpapi/, ''),
        },
      },
    },
    // SPA fallback - redirect all routes to index.html
    appType: 'spa',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'SkillZone Gaming Club',
          short_name: 'SkillZone',
          description: 'Síť herních klubů v Praze. RTX 4070 Ti Super, 240Hz.',
          theme_color: '#E31E24',
          background_color: '#050505',
          icons: [
            {
              src: '/icons/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: '/icons/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GOOGLE_PLACES_KEY': JSON.stringify(env.GOOGLE_PLACES_KEY || env.GEMINI_API_KEY),
      'process.env.SERPAPI_KEY': JSON.stringify(env.SERPAPI_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // Build optimizations
    build: {
      // Enable minification
      minify: 'esbuild',
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunk for React
            'react-vendor': ['react', 'react-dom'],
            // Separate chunk for icons
            'icons': ['lucide-react'],
            // Separate chunk for Supabase
            'supabase': ['@supabase/supabase-js'],
          }
        }
      },
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Generate source maps for debugging
      sourcemap: false,
      // Chunk size warning limit
      chunkSizeWarningLimit: 500,
    }
  };
});

