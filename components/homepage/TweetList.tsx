// components/homepage/TweetList.tsx
import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Box, Spinner, VStack, Text } from "@chakra-ui/react";
import Tweet from "./Tweet";
import { ExtendedComment } from "@/hooks/useComments";
import TweetComposer from "./TweetComposer";

interface InfiniteScrollData {
  comments: ExtendedComment[];
  loadNextPage: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

interface TweetListProps {
  author: string;
  permlink: string;
  setConversation: (conversation: ExtendedComment) => void;
  onOpen: () => void;
  setReply: (reply: ExtendedComment) => void;
  newComment: ExtendedComment | null;
  post?: boolean;
  data: InfiniteScrollData;
  showComposer?: boolean; // NOVA PROP
}

function handleNewComment() {}

//showComposer = true significa que o composer será exibido no feed (homepage)
//sendo assim esse frame me permite postar um snap
export default function TweetList({
  author,
  permlink,
  setConversation,
  onOpen,
  setReply,
  newComment,
  post = false,
  data,
  showComposer = true, // padrão: mostrar
}: TweetListProps) {
  const { comments, loadNextPage, isLoading, hasMore } = data;

  // Ordena por data (mais recente primeiro)
  comments.sort((a: ExtendedComment, b: ExtendedComment) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  if (isLoading && comments.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Spinner size="xl" />
        <Text>Loading Snaps...</Text>
      </Box>
    );
  }

  return (
    <InfiniteScroll
      dataLength={comments.length}
      next={loadNextPage}
      hasMore={hasMore}
      loader={
        <Box display="flex" justifyContent="center" alignItems="center" py={5}>
          <Spinner size="xl" color="primary" />
        </Box>
      }
      scrollableTarget="scrollableDiv"
    >
      <VStack spacing={1} align="stretch" mx="auto">
        {/* CONDICIONAL: só mostra no feed (home) */}
        {showComposer && (
          <TweetComposer
            pa={author}
            pp={permlink}
            onNewComment={handleNewComment}
            onClose={() => null}
            post={false} // "POST" no feed
          />
        )}

        {comments.map((comment: ExtendedComment) => (
          <Tweet
            key={comment.permlink}
            comment={comment}
            onOpen={onOpen}
            setReply={setReply}
            {...(!post ? { setConversation } : {})}
          />
        ))}
      </VStack>
    </InfiniteScroll>
  );
}
