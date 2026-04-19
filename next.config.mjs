/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    // Force jsPDF to use browser version
    config.resolve.alias = {
      ...config.resolve.alias,
      'jspdf': 'jspdf/dist/jspdf.umd.min.js',
    };
    return config;
  },
}

export default nextConfig
