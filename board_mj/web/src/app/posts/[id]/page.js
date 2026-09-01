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
        <main>
            <Link href="/" className="muted">← 뒤로</Link>

            <div className="card-head" style={{ padding: '20px 4px 0' }}>
                <div className="avatar">{post.author?.name?.[0] ?? '?'}</div>
                <div>
                    <div className="name">{post.author?.name ?? '알 수 없음'}</div>
                    <div className="date">{new Date(post.createdAt).toLocaleString('ko-KR')}</div>
                </div>
            </div>

            <h1 style={{ marginTop: 20 }}>{post.title}</h1>

            <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.7 }}>
                {post.content}
            </div>

            <div className="card-actions" style={{ borderTop: 'none', paddingLeft: 0 }}>
                <span>💬 {post.commentCount}</span>
                <span>👁 {post.viewCount}</span>
            </div>

            <OwnerActions postId={post._id} authorId={post.author?._id} />
            <Comments postId={post._id} />
        </main>
    );
}