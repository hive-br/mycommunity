'use client';
import { useState } from 'react';
import { Box, Button } from '@chakra-ui/react';

interface SpoilerProps {
  title: string;
  content: string;
}

export function SpoilerComponent({ title, content }: SpoilerProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <Box
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={3}
      my={2}
      bg="gray.50"
    >
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsRevealed(!isRevealed)}
        mb={isRevealed ? 2 : 0}
      >
        {isRevealed ? 'Hide' : 'Show'} Spoiler: {title}
      </Button>
      {isRevealed && (
        <Box mt={2} p={2} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
          {content}
        </Box>
      )}
    </Box>
  );
}

// Function to process markdown and replace spoilers with interactive components
export function processSpoilers(htmlContent: string): string {
  // Regex to match spoiler syntax: >! [Title] Content
  const spoilerRegex = />!\s*\[([^\]]+)\]\s*([\s\S]*?)(?=\n\n|$)/g;
  
  return htmlContent.replace(spoilerRegex, (match, title, content) => {
    const spoilerId = Math.random().toString(36).substr(2, 9);
    return `<div class="spoiler-container" data-title="${title}" data-content="${content.trim()}" data-id="${spoilerId}"></div>`;
  });
}