'use client';

import {useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import Link from 'next/link';
import {apiFetch} from '@/lib/api';

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

        router.push('/now');
    }

    return (
        <header className="site-header">
            <Link href="/now" className="logo">
                ago<span className="ago-logo-dot">.</span>
            </Link>

            <div className="header-actions">
                {!me ? (
                    <Link href="/login" className="header-login-link">
                        로그인
                    </Link>
                ) : (
                    <>
                        <span className="header-user-name">
                            {me.name || me.id}
                        </span>

                        <button
                            type="button"
                            className="header-logout-button"
                            onClick={handleLogout}
                        >
                            로그아웃
                        </button>

                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount}
                            </span>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}
