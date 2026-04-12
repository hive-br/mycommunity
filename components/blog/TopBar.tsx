'use client';
import { Flex, IconButton, Menu, MenuButton, MenuList, MenuItem, Button, ButtonGroup } from '@chakra-ui/react';
import { FaTh, FaBars, FaPen, FaSort } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export type PostSource = 'hive' | 'combflow';

interface TopBarProps {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    setQuery: (query: string) => void;
    source?: PostSource;
    setSource?: (s: PostSource) => void;
}

export default function TopBar({ viewMode, setViewMode, setQuery, source, setSource }: TopBarProps) {
    const router = useRouter();
    const isCombflow = source === 'combflow';

    return (
        <Flex justifyContent="space-between" mb={4} wrap="wrap" gap={2}>
            <Flex gap={2} align="center">
                <IconButton
                    aria-label="Compose"
                    icon={<FaPen />}
                    onClick={() => router.push('/compose')}
                    variant="outline"
                />
                {setSource && (
                    <ButtonGroup size="md" isAttached variant="outline">
                        <Button
                            onClick={() => setSource('hive')}
                            variant={!isCombflow ? 'solid' : 'outline'}
                        >
                            Hive
                        </Button>
                        <Button
                            onClick={() => setSource('combflow')}
                            variant={isCombflow ? 'solid' : 'outline'}
                        >
                            Discovery
                        </Button>
                    </ButtonGroup>
                )}
            </Flex>
            <Flex justifyContent="flex-end">
                <IconButton
                    aria-label="Grid View"
                    icon={<FaTh />}
                    onClick={() => setViewMode('grid')}
                    isActive={viewMode === 'grid'}
                    variant={viewMode === 'grid' ? 'solid' : 'outline'}
                />
                <IconButton
                    aria-label="List View"
                    icon={<FaBars />}
                    onClick={() => setViewMode('list')}
                    isActive={viewMode === 'list'}
                    variant={viewMode === 'list' ? 'solid' : 'outline'}
                    ml={4}
                />
                {!isCombflow && (
                    <Menu>
                        <MenuButton
                            as={Button}
                            aria-label="Sort Options"
                            leftIcon={<FaSort />}
                            variant="outline"
                            ml={4}
                        >
                            Sort
                        </MenuButton>
                        <MenuList zIndex="popover">
                            <MenuItem onClick={() => setQuery('created')}>Recent</MenuItem>
                            <MenuItem onClick={() => setQuery('trending')}>Trending</MenuItem>
                            <MenuItem onClick={() => setQuery('hot')}>Hot</MenuItem>
                        </MenuList>
                    </Menu>
                )}
            </Flex>
        </Flex>
    );
}
