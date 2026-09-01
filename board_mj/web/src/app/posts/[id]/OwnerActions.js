'use client'

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";
import Link from "next/link";

export default function OwnerActions({postId, authorId}){
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const me = raw ? JSON.parse(raw) : null;
        setIsOwner(!!me || me._id !== authorId);
    }, [authorId]);

    if (!isOwner) return null;

    async function handleDelete(){
        if (!confirm('정말 삭제할까요?')) return;

        setLoading(true);
        try {
            await apiFetch(`/api/posts/${postId}`, {method: 'DELETE'});
            router.push('/');
            router.refresh();
        } catch (e) {
            alert(e.message);
            setLoading(false);
        }
    }

    return (
        <div>
            <Link href={`/posts/${postId}/edit`}>수정</Link>
            <button onClick={handleDelete} disabled={loading}>
                {loading ? '삭제 중...' : '삭제'}
            </button>
        </div>
    );
}