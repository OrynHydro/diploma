import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
