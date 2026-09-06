'use client';

import {useState, useEffect} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import Link from 'next/link';
import {apiFetch} from "@/lib/api";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const [me, setMe] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!me) {
            setUnreadCount(0);
            return;
        }

        async function loadUnreadCount() {
            try {
                const data = await apiFetch('/api/notifications/unread-count');
                setUnreadCount(data.count);
            } catch (err) {
                console.warn('알림 개수 조회 실패:', err.message);
                setUnreadCount(0);
            }
        }

        loadUnreadCount();
    }, [me, pathname]);

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
            <Link href="/" className="logo">
                ago<span className="ago-logo-dot">.</span>
            </Link>

            <nav className="header-nav">
                <Link href="/now" className="muted">
                    NOW
                </Link>

                {me ? (
                    <>
                        <Link href="/posts/new" className="muted">글쓰기</Link>
                        <Link href="/notifications" className="muted">
                            알림
                            {unreadCount > 0 && (
                                <span className="notification-badge">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                        <span className="muted header-user">{me.name}</span>
                        <button className="ghost header-logout" onClick={handleLogout}>로그아웃</button>
                    </>
                ) : (
                    <Link href="/login">
                        <button className="ghost header-login">로그인</button>
                    </Link>
                )}
            </nav>
        </header>
    );
}