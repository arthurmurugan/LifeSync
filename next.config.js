/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        domains: ['images.unsplash.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['googleapis', 'google-auth-library']
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    }
};

module.exports = nextConfig;