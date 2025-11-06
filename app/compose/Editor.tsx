'use client';
import { getFileSignature, uploadImage } from '@/lib/hive/client-functions';
import { FC, useRef, useState, useCallback, useEffect } from "react";
import { Box, Flex, Button, useToast, Textarea, IconButton, HStack, Menu, MenuButton, MenuList, MenuItem, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Input, Tag, TagLabel, TagCloseButton, Wrap, WrapItem, useBreakpointValue } from '@chakra-ui/react';
import { FaImage, FaEye, FaCode, FaBold, FaItalic, FaLink, FaListUl, FaListOl, FaQuoteLeft, FaUnderline, FaStrikethrough, FaHeading, FaChevronDown, FaTable, FaEyeSlash, FaSmile } from 'react-icons/fa';
import { MdGif } from 'react-icons/md';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';
import { processSpoilers } from '@/lib/utils/SpoilerRenderer';
import GiphySelector from '@/components/homepage/GiphySelector';
import { IGif } from '@giphy/js-types';

// Preview Content Component with Spoiler Support
const PreviewContent: FC<{ markdown: string }> = ({ markdown }) => {
    const [spoilerStates, setSpoilerStates] = useState<{[key: string]: boolean}>({});

    const toggleSpoiler = (id: string) => {
        setSpoilerStates(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Process spoilers before rendering
    const processMarkdown = (text: string) => {
        // Handle spoilers first
        let processed = text.replace(
            />!\s*\[([^\]]+)\]\s*([\s\S]*?)(?=\n(?!>)|\n\n|$)/gm,
            (match, title, content) => {
                const spoilerId = `spoiler-${Math.random().toString(36).substr(2, 9)}`;
                return `<div class="spoiler-container" data-title="${title}" data-content="${content.trim()}" data-id="${spoilerId}"></div>`;
            }
        );

        return processed;
    };

    const processedMarkdown = processMarkdown(markdown);
    const renderedHtml = markdownRenderer(processedMarkdown);

    // Handle spoiler rendering after component mounts/updates
    useEffect(() => {
        const spoilerContainers = document.querySelectorAll('.spoiler-container');
        spoilerContainers.forEach((container) => {
            const element = container as HTMLElement;
            const title = element.getAttribute('data-title') || '';
            const content = element.getAttribute('data-content') || '';
            const id = element.getAttribute('data-id') || '';
            const isRevealed = spoilerStates[id];

            // Create spoiler component
            const spoilerHtml = `
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 8px 0; background-color: #f8fafc;">
                    <button 
                        onclick="this.parentElement.nextElementSibling?.style.display === 'none' ? (this.parentElement.nextElementSibling.style.display = 'block', this.textContent = 'Hide Spoiler: ${title}') : (this.parentElement.nextElementSibling.style.display = 'none', this.textContent = 'Show Spoiler: ${title}')"
                        style="background: #fff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 14px;"
                    >
                        ${isRevealed ? 'Hide' : 'Show'} Spoiler: ${title}
                    </button>
                </div>
                <div style="display: ${isRevealed ? 'block' : 'none'}; margin-top: 8px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;">
                    ${markdownRenderer(content)}
                </div>
            `;

            element.innerHTML = spoilerHtml;
        });
    }, [markdown, spoilerStates]);

    return (
        <Box 
            dangerouslySetInnerHTML={{ 
                __html: renderedHtml
            }}
            sx={{
                // Ensure code blocks are styled properly
                'pre': {
                    backgroundColor: '#f6f8fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: '6px',
                    padding: '16px',
                    overflow: 'auto',
                    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '14px',
                    lineHeight: '1.45'
                },
                'code': {
                    backgroundColor: '#f6f8fa',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '85%'
                },
                // Ensure lists are styled properly
                'ul': {
                    paddingLeft: '2em',
                    marginBottom: '16px',
                    listStyleType: 'disc',
                    marginLeft: '1em'
                },
                'ol': {
                    paddingLeft: '2em',
                    marginBottom: '16px',
                    listStyleType: 'decimal',
                    marginLeft: '1em'
                },
                'li': {
                    marginBottom: '4px',
                    display: 'list-item'
                },
                // Ensure underline tags work properly
                'u': {
                    textDecoration: 'underline'
                },
                // Ensure blockquotes are styled properly
                'blockquote': {
                    borderLeft: '4px solid #ddd',
                    paddingLeft: '16px',
                    marginLeft: '0',
                    marginRight: '0',
                    marginTop: '16px',
                    marginBottom: '16px',
                    fontStyle: 'italic',
                    color: '#666',
                    backgroundColor: '#f9f9f9',
                    padding: '12px 16px'
                },
                'blockquote p': {
                    margin: '0'
                }
            }}
        />
    );
};

interface EditorProps {
  markdown: string;
  setMarkdown: (markdown: string) => void;
  title: string;
  setTitle: (title: string) => void;
  hashtagInput: string;
  setHashtagInput: (input: string) => void;
  hashtags: string[];
  setHashtags: (hashtags: string[]) => void;
  onSubmit: () => void;
}

const Editor: FC<EditorProps> = ({ markdown, setMarkdown, title, setTitle, hashtagInput, setHashtagInput, hashtags, setHashtags, onSubmit }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, sm: false }, { ssr: false });
    const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>(isMobile ? 'editor' : 'split');
    const [spoilerStates, setSpoilerStates] = useState<{[key: string]: boolean}>({});
    const [isGiphyModalOpen, setGiphyModalOpen] = useState(false);
    
    // Handle mobile changes - switch to editor if mobile and currently in split
    useEffect(() => {
        if (isMobile && viewMode === 'split') {
            setViewMode('editor');
        }
    }, [isMobile, viewMode]);

    // Custom image upload handler
    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        try {
            const signature = await getFileSignature(file);
            const uploadUrl = await uploadImage(file, signature);
            return uploadUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload image. Please try again.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            throw error;
        }
    }, [toast]);

    // Insert markdown at cursor position
    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = markdown.substring(start, end);
        const newText = before + selectedText + after;
        
        const newMarkdown = markdown.substring(0, start) + newText + markdown.substring(end);
        setMarkdown(newMarkdown);

        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
        }, 0);
    };

    // Toolbar actions
    const handleBold = () => insertMarkdown('**', '**');
    const handleItalic = () => insertMarkdown('*', '*');
    const handleUnderline = () => insertMarkdown('<u>', '</u>');
    const handleStrikethrough = () => insertMarkdown('~~', '~~');
    const handleLink = () => insertMarkdown('[', '](url)');
    const handleBulletList = () => insertMarkdown('\n- ');
    const handleNumberedList = () => insertMarkdown('\n1. ');
    const handleQuote = () => insertMarkdown('> ');
    const handleCode = () => insertMarkdown('`', '`');
    const handleCodeBlock = () => insertMarkdown('```\n', '\n```');
    const handleTable = () => insertMarkdown('| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n');
    const handleSpoiler = () => insertMarkdown('>! [Hidden Spoiler Text] ', '\n> Optionally with more lines');
    
    // Header actions
    const handleHeader1 = () => insertMarkdown('# ');
    const handleHeader2 = () => insertMarkdown('## ');
    const handleHeader3 = () => insertMarkdown('### ');
    const handleHeader4 = () => insertMarkdown('#### ');
    const handleHeader5 = () => insertMarkdown('##### ');
    const handleHeader6 = () => insertMarkdown('###### ');
    
    // Common emojis list
    const commonEmojis = [
        '😊', '😂', '❤️', '👍', '👎', '🔥', '💯', '🎉', '😍', '🤔',
        '😢', '😎', '🙄', '😴', '🤗', '🤩', '😬', '😱', '🤯', '😇',
        '🚀', '⭐', '💪', '👏', '🙌', '🤝', '💰', '📈', '📉', '💎'
    ];

    // Handle emoji selection
    const handleEmojiClick = (emoji: string) => {
        insertMarkdown(emoji + ' ');
    };

    // Handle image upload
    const handleImageClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    toast({
                        title: "Uploading...",
                        description: "Please wait while we upload your image.",
                        status: "info",
                        duration: 2000,
                        isClosable: true,
                    });
                    
                    const url = await handleImageUpload(file);
                    insertMarkdown(`![${file.name}](${url})`);

                    toast({
                        title: "Success!",
                        description: "Image uploaded successfully.",
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                    });
                } catch (error) {
                    // Error handled in handleImageUpload
                }
            }
        };
        input.click();
    };

    const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = e;
        if (key === " " && hashtagInput.trim()) { // If space is pressed and input is not empty
            setHashtags([...hashtags, hashtagInput.trim()]);
            setHashtagInput(""); // Clear input field
        } else if (key === "Backspace" && !hashtagInput && hashtags.length) {
            // Remove the last tag if backspace is hit and input is empty
            setHashtags(hashtags.slice(0, -1));
        }
    };

    const removeHashtag = (index: number) => {
        setHashtags(hashtags.filter((_, i) => i !== index));
    };

    return (
        <Box h="100%" w="100%">
            {/* View Mode Controls */}
            <Flex mb={2} gap={2} justify="center" align="center">
                <Button
                    leftIcon={<FaCode />}
                    size="sm"
                    variant={viewMode === 'editor' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('editor')}
                >
                    Editor
                </Button>
                {!isMobile && (
                    <Button
                        leftIcon={<FaEye />}
                        size="sm"
                        variant={viewMode === 'split' ? 'solid' : 'outline'}
                        onClick={() => setViewMode('split')}
                    >
                        Split
                    </Button>
                )}
                <Button
                    leftIcon={<FaEye />}
                    size="sm"
                    variant={viewMode === 'preview' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('preview')}
                >
                    Preview
                </Button>
            </Flex>

            {/* Editor Content */}
            <Flex h="calc(100% - 50px)" gap={2}>
                {/* Left Panel - Editor Side */}
                {(viewMode === 'editor' || viewMode === 'split') && (
                    <Box 
                        flex={viewMode === 'split' ? 1 : 'auto'} 
                        h="100%"
                        display="flex"
                        flexDirection="column"
                        gap={2}
                        overflowY="auto"
                        pr={2}
                    >
                        {/* Title Input */}
                        <Box
                            border="1px solid"
                            borderColor="border"
                            borderRadius="md"
                            bg="muted"
                        >
                            <Input
                                placeholder="Enter post title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                size="md"
                                border="none"
                                borderRadius="md"
                                fontWeight="semibold"
                                fontSize="lg"
                                px={3}
                                py={2}
                                bg="muted"
                                color="text"
                                _focus={{ boxShadow: 'none', borderColor: 'primary' }}
                                _placeholder={{ color: 'gray.500' }}
                            />
                        </Box>
                        
                        {/* Markdown Editor Panel */}
                        <Box 
                            h="100%"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="md"
                            display="flex"
                            flexDirection="column"
                            bg="muted"
                    >
                        <Box 
                            bg="muted" 
                            px={3} 
                            py={2} 
                            borderBottom="1px solid" 
                            borderColor="border"
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            flexWrap="wrap"
                        >
                            {/* Header Dropdown */}
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    size="xs"
                                    variant="ghost"
                                    rightIcon={<FaChevronDown />}
                                    minW="auto"
                                    px={2}
                                    fontSize="sm"
                                    fontWeight="bold"
                                >
                                    H
                                </MenuButton>
                                <MenuList>
                                    <MenuItem onClick={handleHeader1} fontSize="xl" fontWeight="bold">
                                        H1 - Large Heading
                                    </MenuItem>
                                    <MenuItem onClick={handleHeader2} fontSize="lg" fontWeight="bold">
                                        H2 - Medium Heading
                                    </MenuItem>
                                    <MenuItem onClick={handleHeader3} fontSize="md" fontWeight="bold">
                                        H3 - Small Heading
                                    </MenuItem>
                                    <MenuItem onClick={handleHeader4} fontSize="sm" fontWeight="bold">
                                        H4 - Extra Small
                                    </MenuItem>
                                    <MenuItem onClick={handleHeader5} fontSize="xs" fontWeight="bold">
                                        H5 - Tiny
                                    </MenuItem>
                                    <MenuItem onClick={handleHeader6} fontSize="xs" fontWeight="normal">
                                        H6 - Minimal
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                            
                            <IconButton
                                aria-label="Bold"
                                icon={<FaBold />}
                                size="xs"
                                variant="ghost"
                                onClick={handleBold}
                            />
                            <IconButton
                                aria-label="Italic"
                                icon={<FaItalic />}
                                size="xs"
                                variant="ghost"
                                onClick={handleItalic}
                            />
                            <IconButton
                                aria-label="Underline"
                                icon={<FaUnderline />}
                                size="xs"
                                variant="ghost"
                                onClick={handleUnderline}
                            />
                            <IconButton
                                aria-label="Strikethrough"
                                icon={<FaStrikethrough />}
                                size="xs"
                                variant="ghost"
                                onClick={handleStrikethrough}
                            />
                            <IconButton
                                aria-label="Link"
                                icon={<FaLink />}
                                size="xs"
                                variant="ghost"
                                onClick={handleLink}
                            />
                            <IconButton
                                aria-label="Bullet List"
                                icon={<FaListUl />}
                                size="xs"
                                variant="ghost"
                                onClick={handleBulletList}
                            />
                            <IconButton
                                aria-label="Numbered List"
                                icon={<FaListOl />}
                                size="xs"
                                variant="ghost"
                                onClick={handleNumberedList}
                            />
                            <IconButton
                                aria-label="Quote"
                                icon={<FaQuoteLeft />}
                                size="xs"
                                variant="ghost"
                                onClick={handleQuote}
                            />
                            <IconButton
                                aria-label="Code Block"
                                icon={<FaCode />}
                                size="xs"
                                variant="ghost"
                                onClick={handleCodeBlock}
                            />
                            <IconButton
                                aria-label="Table"
                                icon={<FaTable />}
                                size="xs"
                                variant="ghost"
                                onClick={handleTable}
                            />
                            <IconButton
                                aria-label="Spoiler"
                                icon={<FaEyeSlash />}
                                size="xs"
                                variant="ghost"
                                onClick={handleSpoiler}
                            />
                            {/* Emoji Picker */}
                            <Menu>
                                <MenuButton
                                    as={IconButton}
                                    aria-label="Emoji"
                                    icon={<FaSmile />}
                                    size="xs"
                                    variant="ghost"
                                />
                                <MenuList maxH="200px" overflowY="auto" display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={1} p={2}>
                                    {commonEmojis.map((emoji, index) => (
                                        <MenuItem
                                            key={index}
                                            onClick={() => handleEmojiClick(emoji)}
                                            minH="32px"
                                            w="32px"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            fontSize="lg"
                                            p={1}
                                        >
                                            {emoji}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                            {/* Giphy Button */}
                            <IconButton
                                aria-label="Add GIF"
                                icon={<MdGif size={16} />}
                                size="xs"
                                variant="ghost"
                                onClick={() => setGiphyModalOpen(!isGiphyModalOpen)}
                            />
                            <IconButton
                                aria-label="Upload Image"
                                icon={<FaImage />}
                                size="xs"
                                variant="ghost"
                                onClick={handleImageClick}
                            />
                        </Box>
                        <Textarea
                            ref={textareaRef}
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            placeholder="Write your markdown here..."
                            className="markdown-editor"
                            border="none"
                            borderRadius="0"
                            resize="none"
                            flex="1"
                            fontFamily="mono"
                            fontSize="sm"
                            p={4}
                            bg="muted"
                            color="text"
                            overflowY="auto"
                            _focus={{ boxShadow: 'none' }}
                            _placeholder={{ color: 'gray.500' }}
                        />
                        </Box>
                        
                        {/* Hashtag Section */}
                        <Box
                            border="1px solid"
                            borderColor="border"
                            borderRadius="md"
                            bg="muted"
                        >
                            {/* Hashtag Input */}
                            <Input
                                placeholder="Enter hashtags (press space to add)"
                                value={hashtagInput}
                                onChange={(e) => setHashtagInput(e.target.value)}
                                onKeyDown={handleHashtagKeyDown}
                                size="sm"
                                border="none"
                                borderRadius="md"
                                px={4}
                                py={2}
                                bg="muted"
                                color="text"
                                _focus={{ boxShadow: 'none', borderColor: 'primary' }}
                                _placeholder={{ color: 'gray.500' }}
                            />
                            
                            {/* Display Hashtags as Tags */}
                            {hashtags.length > 0 && (
                                <Wrap p={3} spacing={2} borderTop="1px solid" borderColor="border">
                                    {hashtags.map((tag, index) => (
                                        <WrapItem key={index}>
                                            <Tag
                                                size="sm"
                                                borderRadius="base"
                                                variant="solid"
                                                colorScheme="blue"
                                            >
                                                <TagLabel>{tag}</TagLabel>
                                                <TagCloseButton onClick={() => removeHashtag(index)} />
                                            </Tag>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            )}
                        </Box>
                        
                        {/* Submit Button */}
                        <Flex justify="flex-end">
                            <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={onSubmit}
                            >
                                Submit
                            </Button>
                        </Flex>
                    </Box>
                )}

                {/* Preview Panel */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <Box 
                        flex={viewMode === 'split' ? 1 : 'auto'}
                        h="100%"
                        border="1px solid"
                        borderColor="border"
                        borderRadius="md"
                        display="flex"
                        flexDirection="column"
                        bg="muted"
                    >
                        <Box 
                            bg="muted" 
                            px={3} 
                            py={2} 
                            borderBottom="1px solid" 
                            borderColor="border"
                            fontSize={title ? "lg" : "sm"}
                            fontWeight={title ? "bold" : "medium"}
                            color="text"
                        >
                            {title || "Preview"}
                        </Box>
                        <Box 
                            flex={1}
                            p={4}
                            overflowY="auto"
                            color="text"
                        >
                            {markdown ? (
                                <PreviewContent markdown={markdown} />
                            ) : (
                                <Box color="gray.500" fontStyle="italic">
                                    Your preview will appear here...
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Flex>
            
            {/* Giphy Selector Modal */}
            <Modal isOpen={isGiphyModalOpen} onClose={() => setGiphyModalOpen(false)} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add GIF</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <GiphySelector
                            apiKey={process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'qXGQXTPKyNJByTFZpW7Kb0tEFeB90faV'}
                            onSelect={(gif, e) => {
                                e.preventDefault();
                                const gifMarkdown = `![${gif.title || 'GIF'}](${gif.images.original.url})`;
                                const textarea = textareaRef.current;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const newText = markdown.substring(0, start) + gifMarkdown + markdown.substring(end);
                                    setMarkdown(newText);
                                    
                                    // Restore cursor position
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.setSelectionRange(start + gifMarkdown.length, start + gifMarkdown.length);
                                    }, 0);
                                } else {
                                    setMarkdown(markdown + (markdown ? '\n\n' : '') + gifMarkdown);
                                }
                                setGiphyModalOpen(false);
                            }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default Editor;
