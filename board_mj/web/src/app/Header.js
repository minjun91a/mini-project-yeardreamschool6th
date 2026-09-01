'use client';

import {useState, useEffect} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import Link from 'next/link';

export default function Header() {
    const [me, setMe] = useState(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const raw = localStorage.getItem('user');
        setMe(raw ? JSON.parse(raw) : null);
    }, [pathname]);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setMe(null);

        router.push('/');
    }

    return (
        <header style={{padding: 16, borderBottom: '1px solid #333', display: 'flex', gap: 12}}>
            <Link href="/">게시판</Link>

            <span style={{marginLeft: 'auto'}}>
                {me ? (
                    <>
                        {me.name}님{' '}
                        <button onClick={handleLogout}>로그아웃</button>
                    </>
                ) : (
                    <Link href="/login">로그인</Link>
                )}
            </span>
        </header>
    );
}