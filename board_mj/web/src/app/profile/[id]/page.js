'use client'

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();

    const userId = params.id;

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                setError('');

                const meData = await apiFetch('/api/auth/me');

                /*
                 * 자기 자신의 프로필이면
                 * /profile 로 이동
                 */
                if (String(meData.user._id) === String(userId)) {
                    router.replace('/profile');
                    return;
                }

                const profileData = await apiFetch(`/api/users/${userId}`);

                setUser(profileData.user);
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

        if (userId) {
            loadProfile();
        }
    }, [userId, router]);

    if (loading) {
        return (
            <main className="profile-page">
                <section className="profile-card">
                    <div className="profile-state">
                        프로필을 불러오는 중...
                    </div>
                </section>
            </main>
        );
    }

    if (error && !user) {
        return (
            <main className="profile-page">
                <section className="profile-card">
                    <div className="profile-state">
                        {error}
                    </div>
                </section>
            </main>
        );
    }

    const displayName =
        user?.name ||
        user?.id ||
        'ago 사용자';

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
                            @{user?.id}
                        </span>
                    </div>

                </div>

                <p className="profile-bio">
                    이 사용자의 장소 기여 기록입니다.
                </p>

                {error && (
                    <p className="profile-action-error">
                        {error}
                    </p>
                )}

                <div className="profile-stats">
                    <div>
                        <strong>
                            {user?.contributionCount || 0}
                        </strong>
                        <span>기여</span>
                    </div>

                    <div>
                        <strong>
                            {user?.followedPlaceCount || 0}
                        </strong>
                        <span>관심 장소</span>
                    </div>

                    <div>
                        <strong>
                            {user?.contributionBreakdown?.placeUpdates || 0}
                        </strong>
                        <span>현장 기록</span>
                    </div>

                    <div>
                        <strong>
                            {user?.contributionBreakdown?.quickSignals || 0}
                        </strong>
                        <span>빠른 신호</span>
                    </div>
                </div>

            </section>
        </main>
    );
}
