'use client'

import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";

export default function Login(){
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit() {
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({id, pw}),
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            router.push('/');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{padding:24, maxWidth: 800, margin: '0 auto'}}>
            <h1>로그인</h1>

            <div>
                <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="아이디"
                />
            </div>

            <div>
                <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="비밀번호"
                />
            </div>

            {error && <p style={{color: 'red'}}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
            </button>
        </main>
    );
}