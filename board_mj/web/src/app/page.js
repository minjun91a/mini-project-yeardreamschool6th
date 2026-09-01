import {apiFetch} from "@/lib/api";
import Link from "next/link";

export default async function Home({searchParams}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    const data = await apiFetch('/api/posts');
    const totalPages = Math.ceil(data.total / data.limit);

    return (
        <main>
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

            {totalPages > 1 && (
                <nav style={{display: 'flex', gep: 8, marginTop: 20}}>
                    {Array.from({length: totalPages}, (_, i) => i + 1).map((n) => (
                        <Link key={n} href={`/?page=${n}`} style={{fontWeight: n === page ? 'bold' : 'normal'}}>
                            {n}
                        </Link>
                    ))}
                </nav>
            )}

            <p>전체 {data.total}건</p>
        </main>
    );
}