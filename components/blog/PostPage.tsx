// app/page.tsx
"use client";

import { Box, Container, Flex, Spinner } from "@chakra-ui/react";
import TweetList from "../homepage/TweetList";
import TweetComposer from "../homepage/TweetComposer";
import { useEffect, useState } from "react";
import { Comment, Discussion } from "@hiveio/dhive";
import Conversation from "../homepage/Conversation";
import TweetReplyModal from "../homepage/TweetReplyModal";
import { getPost } from "@/lib/hive/client-functions";
import PostDetails from "@/components/blog/PostDetails";
import { useComments } from "@/hooks/useComments";

interface PostPageProps {
  author: string;
  permlink: string;
}

export default function PostPage({ author, permlink }: PostPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [post, setPost] = useState<Discussion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Comment | undefined>();
  const [reply, setReply] = useState<Comment>();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState<Comment | null>(null);

  const data = useComments(author, permlink, true);
  const commentsData = {
    ...data,
    loadNextPage: () => {},
    hasMore: false,
  };

  useEffect(() => {
    async function loadPost() {
      setIsLoading(true);
      setIsOpen(false);
      setReply(undefined);
      setConversation(undefined);
      setNewComment(null);

      try {
        const post = await getPost(author, permlink);
        setPost(post);
      } catch (err) {
        setError("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    }
    loadPost();
  }, [author, permlink]);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleNewComment = (newComment: Partial<Comment> | CharacterData) => {
    setNewComment(newComment as Comment);
  };

  if (isLoading || !post || !author || !permlink) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" color="primary" />
      </Box>
    );
  }

  console.log("RENDER:", {
    isOpen,
    reply: !!reply,
    conversation: !!conversation,
  });

  return (
    <Box bg="background" color="text" minH="100vh">
      <Flex direction={{ base: "column", md: "row" }}>
        <Box flex="1" p={4}>
          <Container maxW="container.sm">
            <PostDetails post={post} />
            {!conversation ? (
              <>
                {/* Composer fixo: só se modal fechado */}
                {!isOpen && (
                  <TweetComposer
                    pa={author}
                    pp={permlink}
                    onNewComment={handleNewComment}
                    onClose={onClose}
                    post={true} // "REPLY"
                  />
                )}

                {/*da forma como está aqui, mostra o frame para responder como Reply e apenas 1 vez. O erro de mostrar 2 vezes
                no blog foi corrigido*/}
                <TweetList
                  author={author}
                  permlink={permlink}
                  setConversation={setConversation}
                  onOpen={onOpen}
                  setReply={setReply}
                  newComment={newComment}
                  post={true}
                  data={commentsData}
                  showComposer={false} // NÃO mostra composer aqui
                />
              </>
            ) : (
              <Conversation
                comment={conversation}
                setConversation={setConversation}
                onOpen={onOpen}
                setReply={setReply}
              />
            )}
          </Container>
        </Box>
      </Flex>

      {/* Modal: só se isOpen e reply existirem */}
      {isOpen && reply && (
        <TweetReplyModal
          isOpen={isOpen}
          onClose={onClose}
          comment={reply}
          onNewReply={handleNewComment}
        />
      )}
    </Box>
  );
}
