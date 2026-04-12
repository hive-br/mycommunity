/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Increase the body size limit
        },
    },
    async rewrites() {
        return [
            {
                source: '/api/combflow/:path*',
                destination: 'https://combflow.net/:path*',
            },
        ];
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                memcpy: false,
            };
        }
        return config;
    }
}

export default nextConfig;

