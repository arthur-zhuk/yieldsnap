'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectWallet } from '@/components/ui/connect-wallet';
import { YieldOpportunity } from '@/components/yield-scanner/YieldTable';
import { EnhancedYieldTable } from '@/components/yield-scanner/EnhancedYieldTable';
import { depositToProtocol } from '@/lib/services/yieldService';
import { fetchYieldOpportunities } from '@/lib/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  // Handle hydration
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [depositState, setDepositState] = useState<{
    isDepositing: boolean;
    opportunity?: YieldOpportunity;
    txHash?: string;
    error?: string;
  }>({
    isDepositing: false,
  });

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch yield opportunities when wallet connects
  useEffect(() => {
    if (!mounted) return;
    
    async function fetchOpportunities() {
      setIsLoading(true);
      try {
        // Use the server-side API to fetch data (avoids CORS and rate limiting)
        const data = await fetchYieldOpportunities(address);
        
        // Validate the data before setting it
        if (Array.isArray(data) && data.length > 0) {
          console.log('Received valid opportunities data:', data);
          setOpportunities(data);
        } else {
          console.warn('Received empty or invalid data from API');
          // If we're connected but have no data, show mock data for demo purposes
          if (address) {
            console.log('Using mock data for connected wallet');
            // Manually set some mock data for demonstration
            setOpportunities([
              {
                protocol: 'Aave',
                asset: 'USDC',
                symbol: 'USDC',
                apr: 5.2,
                tvl: 500000000,
                userBalance: 100,
                depositUrl: 'https://app.aave.com',
                contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
              },
              {
                protocol: 'Aave',
                asset: 'DAI',
                symbol: 'DAI',
                apr: 4.5,
                tvl: 200000000,
                userBalance: 50,
                depositUrl: 'https://app.aave.com',
                contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching yield opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();

    // Set up an interval to refresh data every 60 seconds
    const intervalId = setInterval(fetchOpportunities, 60000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [address, mounted]);

  // Handle deposit
  const handleDeposit = async (opportunity: YieldOpportunity) => {
    if (!address || !isConnected || !walletClient) return;
    
    setDepositState({
      isDepositing: true,
      opportunity,
    });

    try {
      // In a real implementation, we would show a modal to input the amount
      // For now, we'll just deposit the full balance
      const amount = opportunity.userBalance;
      
      // Calculate the fee (0.5%)
      const fee = amount * 0.005;
      const amountAfterFee = amount - fee;
      
      const result = await depositToProtocol(opportunity, amount, address, walletClient);
      
      if (result.success) {
        setDepositState({
          isDepositing: false,
          opportunity,
          txHash: result.txHash,
        });
        
        // Refresh opportunities after deposit
        const updatedOpportunities = await fetchYieldOpportunities(address);
        setOpportunities(updatedOpportunities);
      } else {
        setDepositState({
          isDepositing: false,
          opportunity,
          error: result.error || 'Transaction failed',
        });
      }
    } catch (error) {
      console.error('Error depositing:', error);
      setDepositState({
        isDepositing: false,
        opportunity,
        error: 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">YieldSnap</h1>
          <ConnectWallet />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Hero section */}
          <section className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Find the Best DeFi Yields</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Connect your wallet to scan for the highest yield opportunities across Polygon DeFi protocols.
            </p>
            <p className="text-md text-muted-foreground mb-8">
              New to DeFi? Our educational tools will help you understand yield farming concepts and make informed decisions.
            </p>
            
            {!isConnected && mounted && (
              <div className="flex justify-center">
                <ConnectWallet />
              </div>
            )}
          </section>
          
          {/* Yield opportunities */}
          <section>
            <EnhancedYieldTable 
              opportunities={opportunities} 
              onDeposit={handleDeposit} 
              isLoading={isLoading} 
            />
          </section>
          
          {/* Transaction status */}
          {depositState.txHash && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Successful</CardTitle>
                <CardDescription>
                  Your deposit to {depositState.opportunity?.protocol} was successful.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Amount:</span> {depositState.opportunity?.userBalance.toFixed(2)} {depositState.opportunity?.symbol}
                  </p>
                  <p>
                    <span className="font-medium">Fee (0.5%):</span> {(depositState.opportunity?.userBalance ? depositState.opportunity.userBalance * 0.005 : 0).toFixed(2)} {depositState.opportunity?.symbol}
                  </p>
                  <p className="mb-4">
                    <span className="font-medium">Transaction Hash:</span> <code className="bg-muted p-1 rounded">{depositState.txHash}</code>
                  </p>
                </div>
                <Button
                  onClick={() => setDepositState({ isDepositing: false })}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}
          
          {depositState.error && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Failed</CardTitle>
                <CardDescription>
                  There was an error with your deposit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-red-500">
                  Error: {depositState.error}
                </p>
                <Button
                  onClick={() => setDepositState({ isDepositing: false })}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} YieldSnap. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                YieldSnap is an educational tool and does not provide financial advice.
              </p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                FAQ
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Learn DeFi
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
