import { Box, Text, HStack, Button, Avatar, Link, VStack, Flex, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/react';
import { Comment } from '@hiveio/dhive';
import { ExtendedComment } from '@/hooks/useComments';
import { FaRegComment, FaRegHeart, FaShare, FaHeart } from "react-icons/fa";
import { useAioha } from '@aioha/react-ui';
import { useState, useMemo } from 'react';
import { getPayoutValue } from '@/lib/hive/client-functions';
import { getPostDate } from '@/lib/utils/GetPostDate';
import { separateContent } from '@/lib/utils/snapUtils';
import MediaRenderer from '@/components/shared/MediaRenderer';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';

interface SnapProps {
    comment: ExtendedComment;
    onOpen: () => void;
    setReply: (comment: Comment) => void;
    setConversation?: (conversation: Comment) => void;
    level?: number; // Added level for indentation
}

const Snap = ({ comment, onOpen, setReply, setConversation, level = 0 }: SnapProps) => {
    const commentDate = getPostDate(comment.created);
    const { aioha, user } = useAioha();
    const [voted, setVoted] = useState(comment.active_votes?.some(item => item.voter === user))
    const [sliderValue, setSliderValue] = useState(5);
    const [showSlider, setShowSlider] = useState(false);

    // Separate media from text using SkateHive's pattern
    const { text, media } = useMemo(
        () => separateContent(comment.body),
        [comment.body]
    );

    // Render text as HTML using markdown renderer
    const renderedText = useMemo(
        () => text ? markdownRenderer(text) : '',
        [text]
    );

    const replies = comment.replies;

    function handleHeartClick() {
        setShowSlider(!showSlider);
    }

    function handleReplyModal() {
        setReply(comment);
        onOpen();
    }

    function handleConversation() {
        if (setConversation) setConversation(comment);
    }

    async function handleVote() {
        const vote = await aioha.vote(comment.author, comment.permlink, sliderValue * 100);
        setVoted(vote.success);
        handleHeartClick();
    }
    return (
        <Box pl={level > 0 ? 1 : 0} ml={level > 0 ? 2 : 0}>
            <Box
                bg="muted"
                p={4}
                mt={1}
                mb={1}
                border="tb1"
                borderRadius="base"  // This will apply the borderRadius from your theme
                width="100%"
            >
                <HStack mb={2}>
                    <Avatar 
                        size="sm" 
                        name={comment.author} 
                        src={`https://images.hive.blog/u/${comment.author}/avatar/sm`}
                    />
                    <Box ml={3}>
                        <Text fontWeight="medium" fontSize="sm">
                            <Link href={`/@${comment.author}`}>@{comment.author}</Link>
                        </Text>
                        <Text fontWeight="medium" fontSize="sm" color="primary">
                            {commentDate}
                        </Text>
                    </Box>
                </HStack>
                
                {/* Render media separately using MediaRenderer */}
                {media && <MediaRenderer mediaContent={media} />}
                
                {/* Render text content with proper markdown processing */}
                {renderedText && (
                    <Box 
                        dangerouslySetInnerHTML={{ __html: renderedText }}
                        sx={{
                            "& p": { marginBottom: 2 },
                            "& a": { color: "primary", textDecoration: "underline" }
                        }}
                    />
                )}
                
                {showSlider ? (
                <Flex mt={4} alignItems="center">
                    <Box width="100%" mr={2}>
                        <Slider
                            aria-label="slider-ex-1"
                            min={0}
                            max={100}
                            value={sliderValue}
                            onChange={(val) => setSliderValue(val)}
                        >
                            <SliderTrack>
                                <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                        </Slider>
                    </Box>
                    <Button size="xs" onClick={handleVote}>&nbsp;&nbsp;&nbsp;Vote {sliderValue} %&nbsp;&nbsp;&nbsp;</Button>
                    <Button size="xs" onClick={handleHeartClick} ml={2}>X</Button>

                </Flex>
            ) : (
                <HStack justify="space-between" mt={3}>
                    <Button leftIcon={voted ? (<FaHeart />) : (<FaRegHeart />)} variant="ghost" onClick={handleHeartClick}>
                        {comment.active_votes?.length}
                    </Button>
                    <HStack>
                        <FaRegComment onClick={handleReplyModal} cursor="pointer" />
                        {setConversation && (
                            <Text onClick={handleConversation} cursor="pointer" fontWeight="bold">
                                {comment.children}
                            </Text>
                        )}
                    </HStack>
                    <Text fontWeight="bold" fontSize="sm">
                    ${getPayoutValue(comment)}
                    </Text>
                </HStack>
            )}
            </Box>
            {/* Render replies recursively */}
            {replies && replies.length > 0 && (
                <VStack spacing={2} align="stretch" mt={2}>
                    {replies.map((reply: Comment) => (
                        <Snap
                            key={reply.permlink}
                            comment={reply}
                            onOpen={onOpen}
                            setReply={setReply}
                            setConversation={setConversation}
                            level={level + 1} // Increment level for indentation
                        />
                    ))}
                </VStack>
            )}
        </Box>
    );
};

export default Snap;
