import {apiFetch} from "@/lib/api";
import {notFound} from "next/navigation";
import Link from "next/link";
import OwnerActions from "@/app/posts/[id]/OwnerActions";
import Comments from "./Comments";

const STATUS_LABEL = {
    quiet: "🟢 여유",
    normal: "🟡 보통",
    busy: "🔴 혼잡"
};

function formatRelativeTime(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);

    const diff = now - created;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return created.toLocaleDateString("ko-KR");
}

export default async function PostDetail({params}) {
    const {id} = await params;

    let data;

    try {
        data = await apiFetch(`/api/posts/${id}`);
    } catch (e) {
        if (e.status === 404) {
            notFound();
        }

        throw e;
    }

    const post = data.post;

    const isNowPost = post.kind === "now";

    return (
        <main className="now-post-detail-page">
            <section className="now-post-detail-shell">

                <header className="now-post-detail-header">
                    <Link
                        href={
                            isNowPost && post.place?._id
                                ? `/places/${post.place._id}`
                                : "/now"
                        }
                        className="now-post-detail-back"
                    >
                        ←
                    </Link>

                    <div>
                        <h1>
                            {isNowPost
                                ? post.place?.name || "NOW"
                                : post.title || "게시글"}
                        </h1>

                        {isNowPost && post.place?.address && (
                            <span>
                                {post.place.address}
                            </span>
                        )}
                    </div>
                </header>

                <article className="now-post-detail-card">

                    <header className="now-post-detail-author">
                        <div className="now-post-detail-avatar">
                            {post.author?.name?.[0] ?? "?"}
                        </div>

                        <div className="now-post-detail-author-info">
                            <strong>
                                {post.author?.name ?? "알 수 없음"}
                            </strong>

                            <span>
                                {formatRelativeTime(post.createdAt)}
                            </span>
                        </div>
                    </header>

                    {isNowPost && (
                        <div className="now-post-detail-tags">
                            {post.status && (
                                <span className={`now-status ${post.status}`}>
                                    {STATUS_LABEL[post.status] || post.status}
                                </span>
                            )}

                            {post.visitVerified && (
                                <span className="now-post-detail-verified">
                                    현장 인증
                                </span>
                            )}
                        </div>
                    )}

                    {!isNowPost && post.title && (
                        <h2 className="now-post-detail-title">
                            {post.title}
                        </h2>
                    )}

                    <p className="now-post-detail-content">
                        {post.content}
                    </p>

                    {post.imageUrl && (
                        <div className="now-post-detail-image">
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${post.imageUrl}`}
                                alt="게시글 이미지"
                            />
                        </div>
                    )}

                    <footer className="now-post-detail-stats">
                        <span>
                            댓글 {post.commentCount || 0}
                        </span>

                        <span>
                            조회 {post.viewCount || 0}
                        </span>
                    </footer>

                    <OwnerActions
                        postId={post._id}
                        authorId={post.author?._id}
                    />

                    <Comments postId={post._id} />
                </article>

            </section>
        </main>
    );
}