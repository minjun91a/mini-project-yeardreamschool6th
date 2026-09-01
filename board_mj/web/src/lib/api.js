const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    console.log('[DEBUG] fetch:', {url: `${BASE}${path}`, hasToken: !!token});

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && {Authorization: `Bearer ${token}`}),
            ...options.headers,
        },
    });

    const json = await res.json();

    console.log('[DEBUG] response:', {status: res.status, success: json.success});

    if (!res.ok) {
        const err = new Error(json.error?.message || '요청 실패');
        err.status = res.status;
        throw err;
    }

    return json.data;
};