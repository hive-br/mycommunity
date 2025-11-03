'use client'
import { Box, Flex } from '@chakra-ui/react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import FooterNavigation from '@/components/layout/FooterNavigation';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <body>
        <Providers>
          <Box bg="background" color="text" minH="100vh">
            <Flex direction={{ base: 'column', md: 'row' }} h="100vh">
              <Sidebar />
              <Box 
                flex="1" 
                ml={{ base: '0', md: '20%' }}
                h="100vh"
                overflowY="auto"
              >
                {children}
              </Box>
            </Flex>
            <FooterNavigation />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
