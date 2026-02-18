/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'wghposuimbzslixfzogk.supabase.co' },
      { protocol: 'https', hostname: 'cdnjs.cloudflare.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
    ],
  },
  // Enable React Compiler for better performance
  reactCompiler: true,
};

export default nextConfig;
