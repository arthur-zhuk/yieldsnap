'use client';

import { useState } from 'react';
import { LiquidityPairScanner } from '@/components/yield-scanner/LiquidityPairScanner';
import { ConnectWallet } from '@/components/ui/connect-wallet';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function LiquidityScannerPage() {
  const { isConnected } = useAccount();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Liquidity Pair Scanner</h1>
      <p className="text-muted-foreground mb-6">
        Find and analyze liquidity pairs with low to medium risk for yield farming
      </p>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to access the Liquidity Pair Scanner
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ConnectWallet />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Alert className="mb-6 bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Info className="h-4 w-4" />
            <AlertTitle>Educational Tool</AlertTitle>
            <AlertDescription>
              This scanner helps you find liquidity pairs for yield farming with low to medium risk.
              It calculates potential profits from both trading fees and reward tokens.
            </AlertDescription>
          </Alert>
          
          <LiquidityPairScanner />
        </>
      )}
    </div>
  );
}
