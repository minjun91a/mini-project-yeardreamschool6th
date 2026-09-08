'use client'

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [followedPlaces, setFollowedPlaces] = useState([]);

    const [contributionCount, setContributionCount] = useState(0);
    const [placeUpdateCount, setPlaceUpdateCount] = useState(0);
    const [quickSignalCount, setQuickSignalCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                setError('');

                const meData = await apiFetch('/api/auth/me');

                const [followedData, profileData] = await Promise.all([
                    apiFetch('/api/place-follows/me'),
                    apiFetch(`/api/users/${meData.user._id}`)
                ]);

                setUser(meData.user);
                setFollowedPlaces(followedData.places || []);
                setContributionCount(profileData.user?.contributionCount || 0);
                setPlaceUpdateCount(
                    profileData.user?.contributionBreakdown?.placeUpdates || 0
                );
                setQuickSignalCount(
                    profileData.user?.contributionBreakdown?.quickSignals || 0
                );
            } catch (err) {
                if (err.status === 401) {
                    router.push('/login');
                    return;
                }

                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-card">
                    <div className="profile-state">
                        프로필을 불러오는 중...
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="profile-page">
                <div className="profile-card">
                    <div className="profile-state">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    const displayName = user?.name || user?.id || 'ago 사용자';
    const userId = user?.id || '';

    const avatarText =
        displayName
            .trim()
            .charAt(0)
            .toUpperCase() || 'A';

    return (
        <main className="profile-page">
            <section className="profile-card">

                <div className="profile-top">
                    <div className="profile-avatar">
                        {avatarText}
                    </div>

                    <div className="profile-user">
                        <strong>
                            {displayName}
                        </strong>

                        <span>
                            @{userId}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="profile-settings"
                        aria-label="설정"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            aria-hidden="true"
                        >
                            <path d="M4 7h10" />
                            <path d="M18 7h2" />
                            <circle cx="16" cy="7" r="2" />

                            <path d="M4 17h2" />
                            <path d="M10 17h10" />
                            <circle cx="8" cy="17" r="2" />
                        </svg>
                    </button>
                </div>

                <p className="profile-bio">
                    관심 장소와 현장 기여를 모아둔 공간입니다.
                </p>

                <div className="profile-stats">
                    <div>
                        <strong>{contributionCount}</strong>
                        <span>기여</span>
                    </div>

                    <div>
                        <strong>
                            {followedPlaces.length}
                        </strong>
                        <span>관심 장소</span>
                    </div>

                    <div>
                        <strong>{placeUpdateCount}</strong>
                        <span>현장 기록</span>
                    </div>

                    <div>
                        <strong>{quickSignalCount}</strong>
                        <span>빠른 신호</span>
                    </div>
                </div>

                <section className="profile-followed">
                    <div className="profile-section-head">
                        <strong>
                            관심 장소
                        </strong>

                        <span>
                            {followedPlaces.length}
                        </span>
                    </div>

                    {followedPlaces.length === 0 ? (
                        <div className="profile-followed-empty">
                            아직 관심 장소가 없습니다.
                        </div>
                    ) : (
                        <div className="profile-followed-list">
                            {followedPlaces.map((place) => (
                                <Link
                                    key={place._id}
                                    href={`/places/${place._id}`}
                                    className="profile-followed-place"
                                >
                                    <div className="profile-followed-avatar">
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="18"
                                            height="18"
                                            aria-hidden="true"
                                        >
                                            <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
                                            <circle cx="12" cy="10" r="2.2" />
                                        </svg>
                                    </div>

                                    <strong>
                                        {place.name}
                                    </strong>

                                    <span>
                                        {place.category}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

            </section>
        </main>
    );
}
