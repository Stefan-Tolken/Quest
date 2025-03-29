const withPWA = require('next-pwa')({
  dest: 'public',
  // disable: process.env.NODE_ENV === 'development',
  disable: false,
  // optional: add other PWA options here
  // register: true,
  // scope: '/app',
  // sw: 'service-worker.js',
  // ...
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  // your other Next.js config options
}

module.exports = withPWA(nextConfig)