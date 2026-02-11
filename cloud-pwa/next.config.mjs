const nextConfig = {
    // output: 'standalone', // Removed for Vercel deployment stability
    // reactCompiler: true, // Disabled for stability
    env: {
        // DATABASE_URL is managed by Vercel System Env
        // AGENT_SECRET_TOKEN is managed by Vercel Env
        WOO_URL: 'https://VAS_ESHO_URL.sk', // Zadajte URL vášho eshopu
        WOO_API_KEY: 'VAS_API_KEY',       // Zadajte kľúč z wp-config.php
        // API_SECRET_TOKEN is handled by server-side process.env
        // NEXT_PUBLIC_API_SECRET_TOKEN is handled by client-side inline
        // OPENAI_API_KEY: 'SK-MISSING', 
    },
};

export default nextConfig;
