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
        <main style={{padding:24, maxWidth: 800, margin: '0 auto'}}>
            <Link href="/">← 목록</Link>

            <h1>{post.title}</h1>

            <p>
                {post.author?.name ?? '알 수 없음'}
                {' · 조회 '}{post.viewCount}
                {' · 댓글 '}{post.commentCount}
            </p>

            <hr />

            <div style={{whiteSpace: 'pre-wrap'}}>{post.content}</div>
            <Comments postId={post._id}/>
            <OwnerActions postId={post._id} authorId={post.author?._id}/>
        </main>
    );
}