'use client'

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();

    const userId = params.id;

    const [user, setUser] = useState(null);
    const [postCount, setPostCount] = useState(0);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

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

                const [profileData, postsData] = await Promise.all([
                    apiFetch(`/api/users/${userId}`),
                    apiFetch(`/api/posts?author=${userId}&limit=1`)
                ]);

                setUser(profileData.user);
                setPostCount(postsData.total || 0);

                const followingIds = meData.user.following || [];

                setIsFollowing(
                    followingIds.some(
                        (id) => String(id) === String(userId)
                    )
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

        if (userId) {
            loadProfile();
        }
    }, [userId, router]);


    async function handleFollow() {
        if (followLoading) {
            return;
        }

        try {
            setFollowLoading(true);
            setError('');

            if (isFollowing) {
                const data = await apiFetch(
                    `/api/users/${userId}/follow`,
                    {
                        method: 'DELETE'
                    }
                );

                setIsFollowing(false);

                setUser((current) => ({
                    ...current,
                    followerCount:
                        data.followerCount ??
                        Math.max(
                            0,
                            (current?.followerCount || 0) - 1
                        )
                }));
            } else {
                const data = await apiFetch(
                    `/api/users/${userId}/follow`,
                    {
                        method: 'POST'
                    }
                );

                setIsFollowing(true);

                setUser((current) => ({
                    ...current,
                    followerCount:
                        data.followerCount ??
                        (current?.followerCount || 0) + 1
                }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setFollowLoading(false);
        }
    }


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

                    <button
                        type="button"
                        className={`profile-follow-button ${
                            isFollowing ? 'following' : ''
                        }`}
                        onClick={handleFollow}
                        disabled={followLoading}
                    >
                        {followLoading
                            ? '처리 중'
                            : isFollowing
                                ? '팔로잉'
                                : '팔로우'
                        }
                    </button>
                </div>

                <p className="profile-bio">
                    지금, 여기, 우리의 이야기
                </p>

                {error && (
                    <p className="profile-action-error">
                        {error}
                    </p>
                )}

                <div className="profile-stats">
                    <div>
                        <strong>
                            {postCount}
                        </strong>
                        <span>게시글</span>
                    </div>

                    <div>
                        <strong>
                            {user?.followedPlaceCount || 0}
                        </strong>
                        <span>팔로우 장소</span>
                    </div>

                    <div>
                        <strong>
                            {user?.followerCount || 0}
                        </strong>
                        <span>팔로워</span>
                    </div>

                    <div>
                        <strong>
                            {user?.followingCount || 0}
                        </strong>
                        <span>팔로잉</span>
                    </div>
                </div>

            </section>
        </main>
    );
}