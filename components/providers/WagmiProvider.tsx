'use client';

import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a Wagmi config
const config = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(),
  },
});

export function WagmiAppProvider({ children }: { children: ReactNode }) {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());
  
  // Handle hydration
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by only rendering children when mounted
  if (!mounted) {
    return null;
  }
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
} 