'use client';
import { Container, Alert, AlertIcon, Box, Text } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { Discussion } from '@hiveio/dhive';
import { findPosts } from '@/lib/hive/client-functions';
import TopBar, { PostSource } from '@/components/blog/TopBar';
import PostInfiniteScroll from '@/components/blog/PostInfiniteScroll';
import CombflowFilters from '@/components/blog/CombflowFilters';
import { useCombflowPosts, CombflowFilters as Filters } from '@/hooks/useCombflowPosts';

const SOURCE_KEY = 'mycommunity.blog.source';

export default function Blog() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [query, setQuery] = useState('created');
    const [allPosts, setAllPosts] = useState<Discussion[]>([]);
    const [source, setSourceState] = useState<PostSource>('hive');
    const isFetching = useRef(false);

    const [filters, setFilters] = useState<Filters>({
        categories: [],
        languages: [],
        sort: 'newest',
        includeNsfw: false,
    });

    const tag = process.env.NEXT_PUBLIC_HIVE_SEARCH_TAG;
    const community = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG;
    const combflowEnabled = process.env.NEXT_PUBLIC_ENABLE_COMBFLOW === 'true';

    const params = useRef([
        {
            tag: tag,
            limit: 12,
            start_author: '',
            start_permlink: '',
        },
    ]);

    async function fetchPosts() {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
            const posts = await findPosts(query, params.current);
            if (posts.length > 0) {
                setAllPosts((prevPosts) => [...prevPosts, ...posts]);
                params.current = [
                    {
                        tag: tag,
                        limit: 12,
                        start_author: posts[posts.length - 1].author,
                        start_permlink: posts[posts.length - 1].permlink,
                    },
                ];
            }
            isFetching.current = false;
        } catch (error) {
            console.log(error);
            isFetching.current = false;
        }
    }

    useEffect(() => {
        if (source !== 'hive') return;
        setAllPosts([]);
        params.current = [
            {
                tag: tag,
                limit: 12,
                start_author: '',
                start_permlink: '',
            },
        ];
        fetchPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, source]);

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(SOURCE_KEY) : null;
        if (stored === 'hive' || stored === 'combflow') setSourceState(stored);
    }, []);
    const setSource = (s: PostSource) => {
        setSourceState(s);
        if (typeof window !== 'undefined') localStorage.setItem(SOURCE_KEY, s);
    };

    const combflow = useCombflowPosts(filters, community);

    return (
        <Container
            id="scrollableDiv"
            maxW="container.lg"
            mt="3"
            h="100vh"
            overflowY="auto"
            sx={{
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
                scrollbarWidth: 'none',
            }}
        >
            <TopBar
                viewMode={viewMode}
                setViewMode={setViewMode}
                setQuery={setQuery}
                source={combflowEnabled ? source : undefined}
                setSource={combflowEnabled ? setSource : undefined}
            />
            {combflowEnabled && source === 'combflow' ? (
                <>
                    <CombflowFilters filters={filters} setFilters={setFilters} />
                    {combflow.error && (
                        <Alert status="error" mb={3}>
                            <AlertIcon />
                            CombFlow error: {combflow.error}
                        </Alert>
                    )}
                    {!combflow.loading && combflow.posts.length === 0 && !combflow.error && (
                        <Box textAlign="center" py={8}>
                            <Text color="gray.500">No classified posts match these filters yet.</Text>
                        </Box>
                    )}
                    <PostInfiniteScroll
                        allPosts={combflow.posts}
                        fetchPosts={combflow.fetchMore}
                        viewMode={viewMode}
                    />
                </>
            ) : (
                <PostInfiniteScroll
                    allPosts={allPosts}
                    fetchPosts={fetchPosts}
                    viewMode={viewMode}
                />
            )}
        </Container>
    );
}
