/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'atomicgroup.com.br',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
