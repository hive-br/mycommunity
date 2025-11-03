'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
  Badge,
  Divider,
  Avatar,
  Flex,
  Link,
  useColorModeValue,
  Checkbox,
  Heading,
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown, FaPiggyBank, FaGift, FaExchangeAlt, FaStore, FaShieldAlt, FaVoteYea } from 'react-icons/fa';
import { getTransactionHistory, Transaction } from '@/lib/hive/client-functions';
import InfiniteScroll from 'react-infinite-scroll-component';

interface TransactionHistoryProps {
  username: string;
}

export default function TransactionHistory({ username }: TransactionHistoryProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [oldestIndex, setOldestIndex] = useState(-1);
  
  // Filter states
  const [filters, setFilters] = useState({
    incoming: true,
    outgoing: true,
    rewards: true,
    powerUpDown: true,
    savings: true,
  });

  useEffect(() => {
    setTransactions([]);
    setOldestIndex(-1);
    setHasMore(true);
    
    const loadInitial = async () => {
      try {
        setLoading(true);
        console.log('Loading initial transactions for:', username);
        const result = await getTransactionHistory(username, -1, 100);
        
        console.log('Initial load - transactions:', result.transactions.length, 'oldestIndex:', result.oldestIndex);
        
        if (result.transactions.length === 0) {
          setHasMore(false);
          setLoading(false);
          return;
        }

        setTransactions(result.transactions);
        setOldestIndex(result.oldestIndex);
        
        // Only stop if we got less than 100 AND we're at index 0
        if (result.oldestIndex <= 0) {
          console.log('All transactions loaded in initial batch');
          setHasMore(false);
        } else {
          console.log('More transactions available, hasMore = true');
          setHasMore(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setLoading(false);
        setHasMore(false);
      }
    };
    
    loadInitial();
  }, [username]);

  const loadMore = async () => {
    try {
      if (oldestIndex <= 0) {
        console.log('Reached the beginning of transaction history');
        setHasMore(false);
        return;
      }

      console.log('Loading more transactions from index:', oldestIndex);
      const result = await getTransactionHistory(username, oldestIndex - 1, 100);
      
      console.log('Loaded', result.transactions.length, 'transactions, new oldestIndex:', result.oldestIndex);
      
      if (result.transactions.length === 0) {
        console.log('No more transactions found');
        setHasMore(false);
        return;
      }

      setTransactions(prev => [...prev, ...result.transactions]);
      setOldestIndex(result.oldestIndex);
      
      if (result.oldestIndex <= 0) {
        console.log('Reached transaction index 0');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
      setHasMore(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return FaExchangeAlt;
      case 'power_up':
        return FaArrowUp;
      case 'power_down':
        return FaArrowDown;
      case 'to_savings':
      case 'from_savings':
        return FaPiggyBank;
      case 'claim_rewards':
        return FaGift;
      default:
        return FaExchangeAlt;
    }
  };

  const getTransactionColor = (type: string, from: string) => {
    if (type === 'claim_rewards') return 'purple';
    if (type === 'power_up') return 'green';
    if (type === 'power_down') return 'orange';
    if (type === 'to_savings') return 'teal';
    if (type === 'from_savings') return 'cyan';
    return from === username ? 'red' : 'green';
  };

  const getTransactionLabel = (type: string, from: string, to: string) => {
    if (type === 'claim_rewards') return 'Claim Rewards';
    if (type === 'power_up') return 'Power Up';
    if (type === 'power_down') return 'Power Down';
    if (type === 'to_savings') return 'To Savings';
    if (type === 'from_savings') return 'From Savings';
    return from === username ? 'Sent' : 'Received';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp + 'Z'); // Add Z to ensure UTC
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Transfer filters
      if (tx.type === 'transfer') {
        const isOutgoing = tx.from === username;
        if (isOutgoing && !filters.outgoing) return false;
        if (!isOutgoing && !filters.incoming) return false;
      }

      // Rewards filter
      if (tx.type === 'claim_rewards' && !filters.rewards) return false;

      // Power Up/Down filter
      if ((tx.type === 'power_up' || tx.type === 'power_down') && !filters.powerUpDown) return false;

      // Savings filter
      if ((tx.type === 'to_savings' || tx.type === 'from_savings') && !filters.savings) return false;

      return true;
    });
  }, [transactions, filters, username]);

  if (loading && transactions.length === 0) {
    return (
      <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor} boxShadow="md" display="flex" justifyContent="center" alignItems="center" py={8}>
        <Spinner size="lg" color="primary" />
      </Box>
    );
  }

  return (
    <Flex bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} boxShadow="md" gap={0}>
      {/* Filters Sidebar */}
      <Box
        w="200px"
        p={4}
        borderRight="1px"
        borderColor={borderColor}
        display={{ base: 'none', md: 'block' }}
      >
        <Heading size="sm" mb={4}>FILTERS</Heading>
        
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2}>
              TRANSFERS
            </Text>
            <VStack align="stretch" spacing={2}>
              <Checkbox
                isChecked={filters.incoming}
                onChange={(e) => setFilters({ ...filters, incoming: e.target.checked })}
                size="sm"
              >
                <Text fontSize="sm">Incoming</Text>
              </Checkbox>
              <Checkbox
                isChecked={filters.outgoing}
                onChange={(e) => setFilters({ ...filters, outgoing: e.target.checked })}
                size="sm"
              >
                <Text fontSize="sm">Outgoing</Text>
              </Checkbox>
            </VStack>
          </Box>

          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2}>
              OPERATIONS
            </Text>
            <VStack align="stretch" spacing={2}>
              <Checkbox
                isChecked={filters.rewards}
                onChange={(e) => setFilters({ ...filters, rewards: e.target.checked })}
                size="sm"
              >
                <Text fontSize="sm">Rewards / Interest</Text>
              </Checkbox>
              <Checkbox
                isChecked={filters.powerUpDown}
                onChange={(e) => setFilters({ ...filters, powerUpDown: e.target.checked })}
                size="sm"
              >
                <Text fontSize="sm">Power Up / Power Down</Text>
              </Checkbox>
              <Checkbox
                isChecked={filters.savings}
                onChange={(e) => setFilters({ ...filters, savings: e.target.checked })}
                size="sm"
              >
                <Text fontSize="sm">To / From Savings</Text>
              </Checkbox>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Transaction List */}
      <Box flex={1} id="scrollableDiv" height="600px" overflowY="auto">
        <InfiniteScroll
          dataLength={transactions.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <Box display="flex" justifyContent="center" py={4}>
              <Spinner size="md" color="primary" />
            </Box>
          }
          endMessage={
            <Text textAlign="center" py={4} color="gray.500" fontSize="sm">
              {filteredTransactions.length === 0 ? 'No transactions match filters' : 'No more transactions'}
            </Text>
          }
          scrollableTarget="scrollableDiv"
          scrollThreshold={0.9}
        >
          <VStack spacing={0} align="stretch">
            {filteredTransactions.map((tx, index) => {
            const isOutgoing = tx.from === username && tx.type === 'transfer';
            const otherParty = isOutgoing ? tx.to : tx.from;
            
            return (
              <Box key={`${tx.timestamp}-${index}`}>
                <Flex
                  p={2}
                  px={4}
                  _hover={{ bg: hoverBg }}
                  transition="background 0.2s"
                  alignItems="center"
                  gap={2}
                >
                  {/* Icon */}
                  <Flex
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg={`${getTransactionColor(tx.type, tx.from)}.100`}
                    color={`${getTransactionColor(tx.type, tx.from)}.500`}
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon as={getTransactionIcon(tx.type)} boxSize={3} />
                  </Flex>

                  {/* Content */}
                  <Box flex={1} minW={0}>
                    <Flex alignItems="center" gap={2}>
                      <Badge
                        colorScheme={getTransactionColor(tx.type, tx.from)}
                        fontSize="2xs"
                        px={1.5}
                        py={0.5}
                      >
                        {getTransactionLabel(tx.type, tx.from, tx.to)}
                      </Badge>
                      {tx.type === 'transfer' && (
                        <Text fontSize="xs" color="gray.600" isTruncated>
                          {isOutgoing ? 'to' : 'from'} @{otherParty}
                        </Text>
                      )}
                      <Text fontSize="2xs" color="gray.400" ml="auto" flexShrink={0}>
                        {formatTimestamp(tx.timestamp)}
                      </Text>
                    </Flex>
                    
                    {tx.memo && tx.memo !== 'Power Up' && tx.memo !== 'Power Down' && (
                      <Text fontSize="2xs" color="gray.500" isTruncated mt={0.5}>
                        {tx.memo}
                      </Text>
                    )}
                  </Box>

                  {/* Amount */}
                  <Text
                    fontWeight="semibold"
                    fontSize="xs"
                    color={isOutgoing && tx.type === 'transfer' ? 'red.500' : 'green.500'}
                    flexShrink={0}
                  >
                    {isOutgoing && tx.type === 'transfer' ? '-' : '+'} {tx.amount}
                  </Text>
                </Flex>
                {index < filteredTransactions.length - 1 && <Divider />}
              </Box>
            );
          })}
        </VStack>
      </InfiniteScroll>
      </Box>
    </Flex>
  );
}
