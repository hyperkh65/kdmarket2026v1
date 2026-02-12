/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'via.placeholder.com',
      'wghposuimbzslixfzogk.supabase.co', // Supabase Storage
      'cdnjs.cloudflare.com'
    ],
  },
  // Enable React Compiler for better performance
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
