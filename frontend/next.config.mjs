/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: '../static',
    basePath: '/static',
    assetPrefix: '/static',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
            },
        ],
    },
};

export default nextConfig;
