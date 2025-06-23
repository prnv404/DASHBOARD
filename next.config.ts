// next.config.ts
import withPWA from 'next-pwa'

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
})({
  reactStrictMode: true,
})

export default nextConfig