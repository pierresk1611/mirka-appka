const nextConfig = {
    // output: 'standalone', // Removed for Vercel deployment stability
    // reactCompiler: true, // Disabled for stability
    env: {
        DATABASE_URL: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza180bzdleWkxamZad3VhY1NVNU9hU0oiLCJhcGlfa2V5IjoiMDFLR0hXNzVGMlM0TldGMENEWEJOWFNKWFQiLCJ0ZW5hbnRfaWQiOiJiZWQzZWJhMjE3N2MwNmFkNDZjMDM4YTZhMTUzMTMxYjlkNTk1M2FkOTlmMzQ5NTUzNjA1YTJhNjgwNWQyMTQ1IiwiaW50ZXJuYWxfc2VjcmV0IjoiYWM5Mjc0ZDctYzM4Mi00NmZlLTg1YzctYTAyOTY0MzEwZWQzIn0.9nGGQXjg1zNNM7LZRi-IjBcXMt55Erp36Aj3aHghrIU',
        AGENT_SECRET_TOKEN: 'mirka-agent-secure-token-2026',
        WOO_URL: 'https://VAS_ESHO_URL.sk', // Zadajte URL vášho eshopu
        WOO_API_KEY: 'VAS_API_KEY',       // Zadajte kľúč z wp-config.php
        // OPENAI_API_KEY: 'SK-MISSING', 
    },
};

export default nextConfig;
