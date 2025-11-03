import React, { useEffect, useState } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { processMarkdownWithVideos } from "@/lib/utils/MarkdownProcessor";
import EnhancedMarkdownRenderer from "./EnhancedMarkdownRenderer";

interface HiveMarkdownProps {
  content: string;
}

/**
 * Async wrapper component that processes markdown with video extraction
 * and renders content with embedded VideoRenderer components
 */
export const HiveMarkdown: React.FC<HiveMarkdownProps> = ({ content }) => {
  const [processedContent, setProcessedContent] = useState<{
    content: string;
    videos: { [key: string]: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function processContent() {
      try {
        setIsLoading(true);
        const result = await processMarkdownWithVideos(content);
        setProcessedContent(result);
      } catch (error) {
        console.error("Error processing markdown:", error);
        // Fallback to empty content
        setProcessedContent({ content: "", videos: {} });
      } finally {
        setIsLoading(false);
      }
    }

    processContent();
  }, [content]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Spinner size="sm" />
      </Box>
    );
  }

  if (!processedContent) {
    return null;
  }

  return (
    <EnhancedMarkdownRenderer
      content={processedContent.content}
      videos={processedContent.videos}
    />
  );
};

export default HiveMarkdown;
