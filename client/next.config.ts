import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
    ],
  },
  async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: 'http://localhost:5000/:path*',
			},
		]
	},
  transpilePackages: ['../shared'],
};

export default nextConfig;
