import { Box } from "@chakra-ui/react";
import React from "react";
import VideoRenderer from "../layout/VideoRenderer";

interface EnhancedMarkdownRendererProps {
  content: string;
  videos: { [key: string]: string };
}

/**
 * Component that renders markdown content with embedded video components
 * Splits content by video placeholders and renders VideoRenderer for each video
 */
export const EnhancedMarkdownRenderer: React.FC<
  EnhancedMarkdownRendererProps
> = ({ content, videos }) => {
  // Split content by video placeholders
  const parts = content.split(/(\[\[VIDEO_\d+\]\])/g);

  return (
    <Box>
      {parts.map((part, index) => {
        // Check if this part is a video placeholder
        const videoMatch = part.match(/\[\[(VIDEO_\d+)\]\]/);

        if (videoMatch) {
          const videoKey = videoMatch[1];
          const videoSrc = videos[videoKey];

          if (videoSrc) {
            return (
              <Box key={`video-${index}`} my={4}>
                <VideoRenderer src={videoSrc} />
              </Box>
            );
          }
        }

        // Render regular HTML content
        return (
          <Box
            key={`content-${index}`}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      })}
    </Box>
  );
};

export default EnhancedMarkdownRenderer;
