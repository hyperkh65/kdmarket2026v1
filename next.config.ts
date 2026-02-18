/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'wghposuimbzslixfzogk.supabase.co' },
      { protocol: 'https', hostname: 'cdnjs.cloudflare.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
    ],
  },
  // Enable React Compiler for better performance
  reactCompiler: true,
};

export default nextConfig;
