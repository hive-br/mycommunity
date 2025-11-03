'use client'
import { useAioha } from '@aioha/react-ui'
import { Flex, Input, Tag, TagCloseButton, TagLabel, Wrap, WrapItem, Button } from '@chakra-ui/react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const Editor = dynamic(() => import('./Editor'), { ssr: false })

export default function Home() {
  const [markdown, setMarkdown] = useState("")
  const [title, setTitle] = useState("")
  const [hashtagInput, setHashtagInput] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])

  const { aioha } = useAioha()
  const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'blog'

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e
    if (key === " " && hashtagInput.trim()) { // If space is pressed and input is not empty
      setHashtags([...hashtags, hashtagInput.trim()])
      setHashtagInput("") // Clear input field
    } else if (key === "Backspace" && !hashtagInput && hashtags.length) {
      // Remove the last tag if backspace is hit and input is empty
      setHashtags(hashtags.slice(0, -1))
    }
  }

  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    const permlink = title.replaceAll(" ", "-")
    await aioha.comment(null, communityTag, permlink, title, markdown, { tags: hashtags, app: 'mycommunity' });
  }

  return (
    <Flex
      width="100%"
      height={{ base: "calc(100vh - 80px)", md: "100vh" }}
      bgColor="white"
      justify="center"
      p="1"
      direction="column"
      overflow="hidden"
    >
      {/* Editor */}
      <Flex
        flex="1"
        border="1px solid"
        borderColor="black"
        borderRadius="base"
        justify="center"
        p="1"
        overflow="hidden" // Prevent internal scrolling
      >
        <Editor 
          markdown={markdown} 
          setMarkdown={setMarkdown} 
          title={title} 
          setTitle={setTitle}
          hashtagInput={hashtagInput}
          setHashtagInput={setHashtagInput}
          hashtags={hashtags}
          setHashtags={setHashtags}
          onSubmit={handleSubmit}
        />
      </Flex>
    </Flex>
  )
}
