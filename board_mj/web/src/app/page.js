import {apiFetch} from "@/lib/api";
import Link from "next/link";

export default async function Home({searchParams}) {
    const params = await searchParams;
    console.log('params', params);
    const page = Number(params.page) || 1;

    const data = await apiFetch(`/api/posts?page=${page}`);
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
                        <li key={post._id} className="card">
                            <div className="card-head">
                                <div className="avatar">{post.author?.name?.[0] ?? '?'}</div>
                                <div>
                                    <div className="name">{post.author?.name ?? '알 수 없음'}</div>
                                    <div className="date">
                                        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                                    </div>
                                </div>
                            </div>

                            <div className="card-body">
                                <Link href={`/posts/${post._id}`} className="card-title">
                                    {post.title}
                                </Link>
                            </div>

                            <div className="card-actions">
                                <span>💬 {post.commentCount}</span>
                                <span>👁 {post.viewCount}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {totalPages > 1 && (
                <nav style={{display: 'flex', gep: 8, marginTop: 20}}>
                    {page > 1 && <Link href={`/?page=${page - 1}`}>이전</Link>}

                    {Array.from({length: totalPages}, (_, i) => i + 1).map((n) => (
                        <Link key={n} href={`/?page=${n}`} style={{fontWeight: n === page ? 'bold' : 'normal'}}>
                            {n}
                        </Link>
                    ))}

                    {page < totalPages && <Link href={`/?page=${page + 1}`}>다음</Link>}
                </nav>
            )}

            <p>전체 {data.total}건</p>
        </main>
    );
}