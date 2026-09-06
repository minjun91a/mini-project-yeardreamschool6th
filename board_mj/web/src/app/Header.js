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
            <Link href="/now" className="logo">
                ago<span className="ago-logo-dot">.</span>
            </Link>

            {!me && (
                <Link href="/login" className="header-login-link">
                    로그인
                </Link>
            )}
        </header>
    );
}