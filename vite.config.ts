import path from "path"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import tailwind from 'tailwindcss'
import { federation } from '@module-federation/vite'

// Custom plugin to inject remote stylesheet
const injectRemoteStylesheet = () => ({
  name: 'inject-remote-stylesheet',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    // Remove any existing remote stylesheet if it exists
    html = html.replace(/<link[^>]*auth-layout\.vercel\.app[^>]*>/g, '');
    
    // Find the last style or link tag in head
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex === -1) return html;
    
    const headContent = html.substring(0, headEndIndex);
    const lastStyleIndex = Math.max(
      headContent.lastIndexOf('</style>'),
      headContent.lastIndexOf('</link>')
    );
    
    // Create the remote stylesheet link
    const remoteStylesheet = `\n    <link rel="stylesheet" href="https://auth-layout.vercel.app/_next/static/chunks/pages/_app.css" media="all" importance="high" data-priority="highest" data-remote="auth" />`;
    
    if (lastStyleIndex !== -1) {
      // Insert after the last style/link tag
      return html.slice(0, lastStyleIndex + 8) + 
        remoteStylesheet +
        html.slice(lastStyleIndex + 8);
    }
    
    // Fallback to end of head if no style/link tag found
    return html.replace(
      '</head>',
      `${remoteStylesheet}\n</head>`
    );
  }
})

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  plugins: [
    federation({
      name: 'board',
      filename: 'remoteEntry.js',
      remotes: {
        auth: 'auth@https://auth-layout.vercel.app/_next/static/chunks/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
    react(),
    vue(),
    injectRemoteStylesheet()
  ],
  build: {
    modulePreload: false,
    minify: false,
    target: 'esnext',
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3003,
    proxy: {
      '/_next': {
        target: 'https://auth-layout.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/_next/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              proxyReq.setHeader('Accept', 'image/*');
            }
          });
        }
      }
    }
  }
})
