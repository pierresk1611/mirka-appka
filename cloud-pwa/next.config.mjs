/** @type {import('next').NextConfig} */
const nextConfig = {
    // reactCompiler: true, // Disabled for stability
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
