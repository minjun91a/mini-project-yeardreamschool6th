import {apiFetch} from "@/lib/api";
import {notFound} from "next/navigation";
import Link from "next/link";
import OwnerActions from "@/app/posts/[id]/OwnerActions";
import Comments from './Comments';

export default async function PostDetail({params}) {
    const {id} = await params;

    let data;
    try {
        data = await apiFetch(`/api/posts/${id}`);
    } catch (e) {
        if (e.status === 404) notFound();
        throw e;
    }

    const post = data.post;

    return (
        <main className="post-detail">
            <Link href="/" className="muted">← 뒤로</Link>

            <div className="card-head">
                <div className="avatar">{post.author?.name?.[0] ?? '?'}</div>
                <div>
                    <div className="name">{post.author?.name ?? '알 수 없음'}</div>
                    <div className="date">{new Date(post.createdAt).toLocaleString('ko-KR')}</div>
                </div>
            </div>

            <h1 className="post-detail-title">{post.title}</h1>

            <div className="post-detail-content">
                {post.content}
            </div>

            <div className="card-actions post-detail-stats">
                <span>💬 {post.commentCount}</span>
                <span>👁 {post.viewCount}</span>
            </div>

            <OwnerActions postId={post._id} authorId={post.author?._id} />
            <Comments postId={post._id} />
        </main>
    );
}