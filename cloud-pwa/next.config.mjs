/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // Removed for Vercel deployment stability
    // reactCompiler: true, // Disabled for stability
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
