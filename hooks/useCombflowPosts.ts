'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Discussion } from '@hiveio/dhive';
import HiveClient from '@/lib/hive/hiveclient';
import { browse, BrowseParams, CombflowPost } from '@/lib/combflow/client';

export interface CombflowFilters {
    categories: string[];
    languages: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    sort: 'newest' | 'oldest';
    maxAge?: string;
    includeNsfw: boolean;
}

export interface HydratedPost extends Discussion {
    combflow?: CombflowPost;
}

async function hydrate(posts: CombflowPost[]): Promise<HydratedPost[]> {
    const results = await Promise.all(
        posts.map(async (p) => {
            try {
                const full = (await HiveClient.database.call('get_content', [
                    p.author,
                    p.permlink,
                ])) as Discussion;
                if (!full || !full.author) return null;
                return { ...full, combflow: p } as HydratedPost;
            } catch {
                return null;
            }
        })
    );
    return results.filter((x): x is HydratedPost => x !== null);
}

export function useCombflowPosts(filters: CombflowFilters, community?: string) {
    const [posts, setPosts] = useState<HydratedPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const cursorRef = useRef<string | null>(null);
    const inflight = useRef(false);

    const buildParams = useCallback(
        (cursor?: string): BrowseParams => ({
            community,
            category: filters.categories.length ? filters.categories : undefined,
            language: filters.languages.length ? filters.languages : undefined,
            sentiment: filters.sentiment,
            sort: filters.sort,
            max_age: filters.maxAge,
            include_nsfw: filters.includeNsfw,
            limit: 12,
            cursor,
        }),
        [filters, community]
    );

    const fetchMore = useCallback(async () => {
        if (inflight.current || !hasMore) return;
        inflight.current = true;
        setLoading(true);
        try {
            const res = await browse(buildParams(cursorRef.current ?? undefined));
            const hydrated = await hydrate(res.posts);
            setPosts((prev) => {
                const seen = new Set(prev.map((p) => `${p.author}/${p.permlink}`));
                const fresh = hydrated.filter((p) => !seen.has(`${p.author}/${p.permlink}`));
                return [...prev, ...fresh];
            });
            cursorRef.current = res.next_cursor;
            setHasMore(Boolean(res.next_cursor) && res.posts.length > 0);
            setError(null);
        } catch (e: any) {
            setError(e?.message ?? 'CombFlow request failed');
            setHasMore(false);
        } finally {
            setLoading(false);
            inflight.current = false;
        }
    }, [buildParams, hasMore]);

    useEffect(() => {
        let cancelled = false;
        setPosts([]);
        cursorRef.current = null;
        setHasMore(true);
        setError(null);
        setLoading(true);
        (async () => {
            try {
                const res = await browse(buildParams());
                if (cancelled) return;
                const hydrated = await hydrate(res.posts);
                if (cancelled) return;
                setPosts((prev) => {
                    const seen = new Set(prev.map((p) => `${p.author}/${p.permlink}`));
                    const fresh = hydrated.filter((p) => !seen.has(`${p.author}/${p.permlink}`));
                    return [...prev, ...fresh];
                });
                cursorRef.current = res.next_cursor;
                setHasMore(Boolean(res.next_cursor) && res.posts.length > 0);
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? 'CombFlow request failed');
                    setHasMore(false);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [buildParams]);

    return { posts, loading, error, hasMore, fetchMore };
}
