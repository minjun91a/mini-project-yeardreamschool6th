const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && {Authorization: `Bearer ${token}`}),
            ...options.headers,
        },
    });

    const json = await res.json();

    if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const currentPath = window.location.pathname + window.location.search;

        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;

        return;
    }

    if (!res.ok) {
        const err = new Error(json.error?.message || '요청 실패');
        err.status = res.status;
        throw err;
    }

    return json.data;
};