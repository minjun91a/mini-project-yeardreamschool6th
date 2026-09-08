'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5.5 10.5V20h13v-9.5"/>
            <path d="M9.5 20v-5.5h5V20"/>
        </svg>
    );
}

function PlaceIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/>
            <circle cx="12" cy="10" r="2.2"/>
        </svg>
    );
}

function WriteIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M4 20h4l11-11-4-4L4 16v4Z"/>
            <path d="m13.5 6.5 4 4"/>
        </svg>
    );
}

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/>
            <path d="M10 21h4"/>
        </svg>
    );
}

function ProfileIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>
        </svg>
    );
}

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/now/write') {
        return null;
    }

    const items = [
        {
            href: '/now',
            label: '홈',
            icon: <HomeIcon />
        },
        {
            href: '/places',
            label: '장소',
            icon: <PlaceIcon />
        },
        {
            href: '/now/write',
            label: 'NOW',
            icon: <WriteIcon />
        },
        {
            href: '/notifications',
            label: '알림',
            icon: <BellIcon />
        },
        {
            href: '/profile',
            label: '마이',
            icon: <ProfileIcon />
        },
    ];

    return (
        <nav className="bottom-nav">
            {items.map((item) => {
                const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bottom-nav-item ${active ? 'active' : ''}`}
                    >
                        <span className="bottom-nav-icon">
                            {item.icon}
                        </span>

                        <span className="bottom-nav-label">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
