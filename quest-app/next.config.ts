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
      // Cache AWS S3 images
      urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aws-images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
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
  }
};

export default withPWACfg(nextConfig);