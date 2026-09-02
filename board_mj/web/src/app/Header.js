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
        <header className="site-header">
            <Link href="/" className="logo">board</Link>

            <nav className="header-nav">
                <Link href="/now" className="muted">
                    NOW
                </Link>

                {me ? (
                    <>
                        <Link href="/posts/new" className="muted">글쓰기</Link>
                        <span className="muted header-user">{me.name}</span>
                        <button className="ghost header-logout" onClick={handleLogout}>로그아웃</button>
                    </>
                ) : (
                    <Link href="/login">
                        <button>로그인</button>
                    </Link>
                )}
            </nav>
        </header>
    );
}