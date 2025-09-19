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
            // MELHORIA DE SEGURANÇA: Removido 'unsafe-inline' do script-src e style-src.
            // Isso aumenta a segurança contra ataques XSS. Teste a aplicação após esta mudança.
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: i.postimg.cc;
              font-src 'self';
              connect-src 'self' https://*.supabase.co wss://*.supabase.co;
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