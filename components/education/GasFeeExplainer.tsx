'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Zap } from 'lucide-react';

interface GasFeeExplainerProps {
  gasFee: string;
}

export function GasFeeExplainer({ gasFee }: GasFeeExplainerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0 ml-2">
          <Zap size={14} />
          <span className="sr-only">Learn about gas fees</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl">Understanding Gas Fees</DialogTitle>
          <DialogDescription className="text-gray-400">
            Learn what gas fees are and why you need to pay them
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-300">What are gas fees?</h4>
            <p className="text-gray-400 mt-1">
              Gas fees are transaction costs paid to network validators for processing your transaction on the blockchain. 
              On Polygon, these fees are paid in MATIC tokens.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300">Your estimated gas fee: {gasFee}</h4>
            <p className="text-gray-400 mt-1">
              This is an estimate of what you'll pay to complete this transaction. Actual fees may vary slightly depending on network conditions.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300">What affects gas fees?</h4>
            <ul className="text-gray-400 mt-1 list-disc pl-5">
              <li>Network congestion - busier networks mean higher fees</li>
              <li>Transaction complexity - more complex operations cost more gas</li>
              <li>Transaction speed - prioritizing faster confirmation increases fees</li>
              <li>Current gas price - fluctuates based on demand</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300">Polygon's advantage</h4>
            <p className="text-gray-400 mt-1">
              Polygon is a Layer 2 scaling solution for Ethereum, offering significantly lower gas fees compared to Ethereum mainnet. 
              This makes small deposits and frequent transactions much more economical.
            </p>
          </div>
          
          <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800">
            <h4 className="font-medium text-blue-300">Beginner tip</h4>
            <p className="text-gray-300 mt-1">
              Make sure you have some MATIC in your wallet to pay for gas fees, even when depositing other tokens like USDC or DAI. 
              Without MATIC, your transaction cannot be processed.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
