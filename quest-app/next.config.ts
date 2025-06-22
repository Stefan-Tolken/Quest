import withPWA from "next-pwa";

const withPWACfg = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true, // ✅ FIXED: Enable automatic registration
  skipWaiting: true,
  dynamicStartUrl: false,
  
  // Enhanced build excludes to prevent the 404 errors
  buildExcludes: [
    /app-build-manifest\.json$/,
    /app-route-manifest\.json$/,
    /middleware-manifest\.json$/,
    /middleware-runtime\.js$/,
    /_middleware\.js$/,
    /chunks\/.*\.js$/, // ✅ Exclude problematic chunk files
    /\.map$/, // Exclude source maps
  ],
  
  // Enhanced runtime caching strategies
  runtimeCaching: [
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-assets",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\/_next\/image.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // Cache your 3D models and media files
      urlPattern: /\/3dModel_Landing\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "3d-assets",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Cache icons and screenshots
      urlPattern: /\/(icons|screenshots)\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "pwa-assets",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      // Cache AWS S3 images - but with shorter cache for pre-signed URLs
      urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
      handler: "NetworkFirst", // Changed to NetworkFirst for pre-signed URLs
      options: {
        cacheName: "aws-images",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 2 * 60 * 60, // 2 hours (shorter for pre-signed URLs)
        },
      },
    },
    {
      // General network-first strategy for API calls and other requests
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offline-cache",
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: `${process.env.AWS_BUCKET_NAME}.s3.us-east-1.amazonaws.com`,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
    // Add these configurations for better handling of pre-signed URLs
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Reduce cache time for external images (helps with pre-signed URLs)
    minimumCacheTTL: 60,
    // Configure sizes for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Set reasonable limits
    formats: ['image/webp'],
    // Add timeout for slow loading images
    domains: [], // Keep empty, use remotePatterns instead
  },
  // Add experimental features that help with external images
  experimental: {
    optimizeCss: true,
  },
};

export default withPWACfg(nextConfig);