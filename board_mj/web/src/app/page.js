import {apiFetch} from "@/lib/api";
import Link from "next/link";

export default async function Home() {
    const data = await apiFetch('/api/posts');

    return (
        <main style={{padding: 24, maxWidth: 800, margin: '0 auto'}}>
            <h1>게시판</h1>

            <Link href="/posts/new">글쓰기</Link>

            {data.items.length === 0 ? (
                <p>아직 글이 없습니다.</p>
            ) : (
                <ul>
                    {data.items.map((post) => (
                        <li key={post._id}>
                            <Link href={`/posts/${post._id}`}>{post.title}</Link>
                            {' - '}
                            {post.author?.name ?? '알 수 없음'}
                            {' · 댓글 '}{post.commentCount}
                        </li>
                    ))}
                </ul>
            )}

            <p>전체 {data.total}건</p>
        </main>
    );
}