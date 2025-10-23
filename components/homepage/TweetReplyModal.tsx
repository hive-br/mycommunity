import { Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, HStack, Avatar, Link, IconButton, Box, Text } from '@chakra-ui/react';
import React from 'react';
import TweetComposer from './TweetComposer';
import { Comment } from '@hiveio/dhive';
import { CloseIcon } from '@chakra-ui/icons';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';
import { getPostDate } from '@/lib/utils/GetPostDate';

interface TweetReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    comment?: Comment;
    onNewReply: (newComment: Partial<Comment>) => void;
}

export default function TweetReplyModal({ isOpen, onClose, comment, onNewReply }: TweetReplyModalProps) {

    if (!comment) {
        return <div></div>;
    }

    const commentDate = getPostDate(comment.created)

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalOverlay bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(10px)" />
            <ModalContent bg="background" color="text" position="relative">
                <IconButton
                    aria-label="Close"
                    icon={<CloseIcon />}
                    onClick={onClose}
                    position="absolute"
                    top={2}
                    right={2}
                    variant="unstyled"
                    size="lg"
                />
                <ModalHeader>
                    <HStack mb={2}>
                        <Avatar size="sm" name={comment.author} src={`https://images.hive.blog/u/${comment.author}/avatar/sm`} />
                        <Box ml={3}>
                            <Text fontWeight="medium" fontSize="sm">
                                <Link href={`/@${comment.author}`}>@{comment.author}</Link>
                            </Text>
                            <Text fontWeight="medium" fontSize="sm" color="primary">
                                {commentDate}
                            </Text>
                        </Box>
                    </HStack>
                </ModalHeader>
                <ModalBody>
                    <Box dangerouslySetInnerHTML={{ __html: markdownRenderer(comment.body) }} pb={6} />
                    <TweetComposer pa={comment.author} pp={comment.permlink} onNewComment={onNewReply} post={true} onClose={onClose} />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
