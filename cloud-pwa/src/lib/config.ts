
export const API_TOKEN = process.env.NEXT_PUBLIC_API_SECRET_TOKEN || 'mirka-agent-secure-token-2026';

export const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
});
