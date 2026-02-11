
export const API_TOKEN = process.env.API_SECRET_TOKEN || 'mirka-agent-secure-token-2026'; // Fallback for dev

export const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
});
