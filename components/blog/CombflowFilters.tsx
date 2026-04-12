'use client';
import {
    Flex,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    MenuDivider,
    MenuGroup,
    Tag,
    TagCloseButton,
    TagLabel,
    Wrap,
    WrapItem,
    Checkbox,
} from '@chakra-ui/react';
import { FaFilter, FaSort, FaLanguage, FaSmile } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { CategoryNode, getCategories, getLanguages } from '@/lib/combflow/client';
import { CombflowFilters as Filters } from '@/hooks/useCombflowPosts';

interface Props {
    filters: Filters;
    setFilters: (f: Filters) => void;
}

export default function CombflowFilters({ filters, setFilters }: Props) {
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);

    useEffect(() => {
        getCategories().then(setCategories).catch(() => {});
        getLanguages()
            .then((l) => setLanguages(l.slice(0, 15).map((x) => x.language)))
            .catch(() => {});
    }, []);

    const toggleCategory = (name: string) => {
        const has = filters.categories.includes(name);
        setFilters({
            ...filters,
            categories: has
                ? filters.categories.filter((c) => c !== name)
                : [...filters.categories, name],
        });
    };

    const toggleLanguage = (code: string) => {
        const has = filters.languages.includes(code);
        setFilters({
            ...filters,
            languages: has
                ? filters.languages.filter((l) => l !== code)
                : [...filters.languages, code],
        });
    };

    return (
        <Flex direction="column" gap={2} mb={3}>
            <Flex wrap="wrap" gap={2}>
                <Menu closeOnSelect={false}>
                    <MenuButton as={Button} leftIcon={<FaFilter />} variant="outline" size="sm">
                        Category
                    </MenuButton>
                    <MenuList maxH="400px" overflowY="auto" zIndex="popover">
                        {categories.map((parent) => (
                            <MenuGroup key={parent.id} title={parent.name}>
                                {(parent.children ?? []).map((child) => (
                                    <MenuItem
                                        key={child.id}
                                        onClick={() => toggleCategory(child.name)}
                                    >
                                        <Checkbox
                                            isChecked={filters.categories.includes(child.name)}
                                            pointerEvents="none"
                                            mr={2}
                                        />
                                        {child.name}
                                    </MenuItem>
                                ))}
                                <MenuDivider />
                            </MenuGroup>
                        ))}
                    </MenuList>
                </Menu>

                <Menu closeOnSelect={false}>
                    <MenuButton as={Button} leftIcon={<FaLanguage />} variant="outline" size="sm">
                        Language
                    </MenuButton>
                    <MenuList maxH="400px" overflowY="auto" zIndex="popover">
                        {languages.map((code) => (
                            <MenuItem key={code} onClick={() => toggleLanguage(code)}>
                                <Checkbox
                                    isChecked={filters.languages.includes(code)}
                                    pointerEvents="none"
                                    mr={2}
                                />
                                {code}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>

                <Menu>
                    <MenuButton as={Button} leftIcon={<FaSmile />} variant="outline" size="sm">
                        {filters.sentiment ? `Sentiment: ${filters.sentiment}` : 'Sentiment'}
                    </MenuButton>
                    <MenuList zIndex="popover">
                        <MenuItem onClick={() => setFilters({ ...filters, sentiment: undefined })}>
                            Any
                        </MenuItem>
                        <MenuItem onClick={() => setFilters({ ...filters, sentiment: 'positive' })}>
                            Positive
                        </MenuItem>
                        <MenuItem onClick={() => setFilters({ ...filters, sentiment: 'neutral' })}>
                            Neutral
                        </MenuItem>
                        <MenuItem onClick={() => setFilters({ ...filters, sentiment: 'negative' })}>
                            Negative
                        </MenuItem>
                    </MenuList>
                </Menu>

                <Menu>
                    <MenuButton as={Button} leftIcon={<FaSort />} variant="outline" size="sm">
                        {filters.sort === 'oldest' ? 'Oldest' : 'Newest'}
                    </MenuButton>
                    <MenuList zIndex="popover">
                        <MenuItem onClick={() => setFilters({ ...filters, sort: 'newest' })}>
                            Newest
                        </MenuItem>
                        <MenuItem onClick={() => setFilters({ ...filters, sort: 'oldest' })}>
                            Oldest
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>

            {(filters.categories.length > 0 || filters.languages.length > 0) && (
                <Wrap>
                    {filters.categories.map((c) => (
                        <WrapItem key={`c-${c}`}>
                            <Tag colorScheme="green">
                                <TagLabel>{c}</TagLabel>
                                <TagCloseButton onClick={() => toggleCategory(c)} />
                            </Tag>
                        </WrapItem>
                    ))}
                    {filters.languages.map((l) => (
                        <WrapItem key={`l-${l}`}>
                            <Tag colorScheme="blue">
                                <TagLabel>{l}</TagLabel>
                                <TagCloseButton onClick={() => toggleLanguage(l)} />
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            )}
        </Flex>
    );
}
