
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN;

export async function authorizeRequest(req: Request) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { ok: false, error: "Unauthorized: Missing Token", status: 401 };
    }

    const token = authHeader.split(' ')[1];

    if (token !== API_SECRET_TOKEN) {
        return { ok: false, error: "Unauthorized: Invalid Token", status: 403 };
    }
    return { ok: true };
}
