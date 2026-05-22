/** @type {import('next').NextConfig} */
const nextConfig = {
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
