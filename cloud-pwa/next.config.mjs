/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // reactCompiler: true, // Disabled for stability
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
