const BASE = '/api/combflow';

export interface CombflowPost {
    id: number;
    author: string;
    permlink: string;
    created: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_score: number;
    community_id: string | null;
    community_name: string | null;
    primary_language: string;
    is_nsfw: boolean;
    category_ids: number[];
    language_codes: string[];
    categories: string[];
    languages: string[];
}

export interface BrowseResponse {
    posts: CombflowPost[];
    count: number;
    total: number;
    next_cursor: string | null;
}

export interface BrowseParams {
    community?: string;
    category?: string[];
    language?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    authors?: string[];
    include_nsfw?: boolean;
    nsfw_only?: boolean;
    max_age?: string;
    sort?: 'newest' | 'oldest';
    limit?: number;
    cursor?: string;
}

export interface CategoryNode {
    id: number;
    name: string;
    children?: CategoryNode[];
}

function buildQuery(params: BrowseParams): string {
    const q = new URLSearchParams();
    if (params.community) q.set('community', params.community);
    params.category?.forEach((c) => q.append('category', c));
    params.language?.forEach((l) => q.append('language', l));
    if (params.sentiment) q.set('sentiment', params.sentiment);
    params.authors?.forEach((a) => q.append('authors', a));
    if (params.include_nsfw) q.set('include_nsfw', 'true');
    if (params.nsfw_only) q.set('nsfw_only', 'true');
    if (params.max_age) q.set('max_age', params.max_age);
    if (params.sort) q.set('sort', params.sort);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.cursor) q.set('cursor', params.cursor);
    return q.toString();
}

export async function browse(params: BrowseParams): Promise<BrowseResponse> {
    const res = await fetch(`${BASE}/api/browse?${buildQuery(params)}`);
    if (!res.ok) throw new Error(`CombFlow browse failed: ${res.status}`);
    return res.json();
}

export async function getCategories(): Promise<CategoryNode[]> {
    const res = await fetch(`${BASE}/categories`);
    if (!res.ok) throw new Error(`CombFlow categories failed: ${res.status}`);
    const data = await res.json();
    return data.categories;
}

export async function getLanguages(): Promise<{ language: string; count: number }[]> {
    const res = await fetch(`${BASE}/api/languages`);
    if (!res.ok) throw new Error(`CombFlow languages failed: ${res.status}`);
    const data = await res.json();
    return data.languages;
}

export async function reportMisclassification(
    author: string,
    permlink: string,
    body: { reporter?: string; reason?: string; suggested_category?: string }
): Promise<void> {
    const res = await fetch(`${BASE}/api/posts/${author}/${permlink}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`CombFlow report failed: ${res.status}`);
}
