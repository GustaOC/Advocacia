// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // CORREÇÃO: Adicionado 'unsafe-inline' ao script-src
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: i.postimg.cc;
              font-src 'self';
              connect-src 'self' https://v0.dev https://v0.app https://v0chat.vercel.sh https://vercel.live/ https://vercel.com https://*.pusher.com/ https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://blobs.vusercontent.net wss://*.pusher.com/ https://fides-vercel.us.fides.ethyca.com/api/v1/ https://cdn-api.ethyca.com/location https://privacy-vercel.us.fides.ethyca.com/api/v1/ https://api.getkoala.com https://*.sentry.io/api/ https://api.v0.dev;
              frame-ancestors 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, " ").trim()
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;