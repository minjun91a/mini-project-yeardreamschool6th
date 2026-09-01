import Link from "next/link";

export default function NotFound(){
    return (
        <main style={{padding: 24, maxWidth: 800, margin: '0 auto'}}>
            <h1>없는 게시글입니다.</h1>
            <p>삭제되었거나 주소가 잘못되었습니다.</p>
            <Link href="/">← 목록으로</Link>
        </main>
    );
}