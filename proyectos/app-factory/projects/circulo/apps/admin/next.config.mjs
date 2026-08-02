/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source and are compiled by Next.
  transpilePackages: ['@circulo/config', '@circulo/types'],
};

export default nextConfig;
