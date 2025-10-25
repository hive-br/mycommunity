//useSnaps.ts
import HiveClient from '@/lib/hive/hiveclient';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ExtendedComment } from './useComments';

interface lastContainerInfo {
  permlink: string;
  date: string;
}

export const useSnaps = () => {
  const lastContainerRef = useRef<lastContainerInfo | null>(null); // Use useRef for last container
  const fetchedPermlinksRef = useRef<Set<string>>(new Set()); // Track fetched permlinks

  const [currentPage, setCurrentPage] = useState(1);
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageMinSize = 10;
  

  // Filter comments by the target tag
  const filterCommentsByTag = useCallback((comments: ExtendedComment[], targetTag: string): ExtendedComment[] => {
    return comments.filter((commentItem) => {
      try {
        if (!commentItem.json_metadata) {
          return false; // Skip if json_metadata is empty
        }
        const metadata = JSON.parse(commentItem.json_metadata);
        const tags = metadata.tags || [];
        return tags.includes(targetTag);
      } catch (error) {
        console.error('Error parsing JSON metadata for comment:', commentItem, error);
        return false; // Exclude comments with invalid JSON
      }
    });
  }, []);

  // Cache for storing filtered comments
  const commentsCache = useRef<Map<string, ExtendedComment[]>>(new Map());

  // Fetch comments with a minimum size
  const getMoreSnaps = useCallback(async (): Promise<ExtendedComment[]> => {
    const tag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || ''
    const author = "peak.snaps";
    const limit = 10; // Increased batch size
    const allFilteredComments: ExtendedComment[] = [];

    let hasMoreData = true;
    let permlink = lastContainerRef.current?.permlink || "";
    let date = lastContainerRef.current?.date || new Date().toISOString();

    while (allFilteredComments.length < pageMinSize && hasMoreData) {
      // Get discussions in larger batches
      const result = await HiveClient.database.call('get_discussions_by_author_before_date', [
        author,
        permlink,
        date,
        limit,
      ]);

      if (!result.length) {
        hasMoreData = false;
        break;
      }

      // Prepare parallel requests for content replies
      const replyPromises = result.map(async (resultItem: any) => {
        // Check cache first
        const cacheKey = `${author}-${resultItem.permlink}`;
        if (commentsCache.current.has(cacheKey)) {
          return {
            comments: commentsCache.current.get(cacheKey)!,
            permlink: resultItem.permlink,
            date: resultItem.created
          };
        }

        // If not in cache, fetch from blockchain
        const comments = (await HiveClient.database.call("get_content_replies", [
          author,
          resultItem.permlink,
        ])) as ExtendedComment[];

        const filteredComments = filterCommentsByTag(comments, tag);
        
        // Store in cache
        commentsCache.current.set(cacheKey, filteredComments);

        return {
          comments: filteredComments,
          permlink: resultItem.permlink,
          date: resultItem.created
        };
      });

      // Execute all requests in parallel
      const replies = await Promise.all(replyPromises);

      // Process results
      for (const reply of replies) {
        if (!fetchedPermlinksRef.current.has(reply.permlink)) {
          allFilteredComments.push(...reply.comments);
          fetchedPermlinksRef.current.add(reply.permlink);
          permlink = reply.permlink;
          date = reply.date;
        }
      }

      // Break early if we have enough comments
      if (allFilteredComments.length >= pageMinSize * 2) {
        break;
      }
    }

    // Update the lastContainerRef state for the next API call
    lastContainerRef.current = { permlink, date };

    return allFilteredComments;
  }, [filterCommentsByTag]);

  // Fetch posts when `currentPage` changes
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const newSnaps = await getMoreSnaps();

        if (newSnaps.length < pageMinSize) {
          setHasMore(false); // No more items to fetch
        }

        // Avoid duplicates in the comments array
        setComments((prevPosts) => {
          const existingPermlinks = new Set(prevPosts.map((post) => post.permlink));
          const uniqueSnaps = newSnaps.filter((snap) => !existingPermlinks.has(snap.permlink));
          return [...prevPosts, ...uniqueSnaps];
        });
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, getMoreSnaps]);

  // Load the next page
  const loadNextPage = () => {
    if (!isLoading && hasMore) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  return { comments, isLoading, loadNextPage, hasMore, currentPage };
};
