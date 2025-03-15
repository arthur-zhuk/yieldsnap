'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, HelpCircle, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TokenInfoProps {
  symbol: string;
}

const tokenData = {
  'USDC': {
    name: 'USD Coin',
    description: 'USDC is a fully-collateralized US dollar stablecoin issued by Circle. Each USDC is backed by one US dollar held in reserve.',
    type: 'Stablecoin',
    riskLevel: 'Low',
    volatility: 'Very Low',
    backingType: 'Fiat-backed (USD)',
    marketCap: '$24.7B+',
    website: 'https://www.circle.com/en/usdc',
    explorer: 'https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    useCase: 'USDC is commonly used for trading, payments, and as a stable store of value in DeFi protocols.',
    risks: [
      'Regulatory risks as a centralized stablecoin',
      'Counterparty risk with Circle and its banking partners',
      'De-pegging risk (though historically very stable)'
    ],
    benefits: [
      'High stability with 1:1 USD backing',
      'Widely accepted across DeFi protocols',
      'Regular attestations of reserves',
      'Fast and low-cost transfers on Polygon'
    ]
  },
  'DAI': {
    name: 'Dai',
    description: 'Dai is a decentralized stablecoin that attempts to maintain a value of $1.00 USD. Unlike centralized stablecoins, Dai is backed by a surplus of cryptocurrencies stored in smart contracts.',
    type: 'Stablecoin',
    riskLevel: 'Low to Medium',
    volatility: 'Low',
    backingType: 'Crypto-collateralized',
    marketCap: '$5.3B+',
    website: 'https://makerdao.com',
    explorer: 'https://polygonscan.com/token/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    useCase: 'Dai is used for trading, lending, as collateral in DeFi protocols, and as a decentralized alternative to centralized stablecoins.',
    risks: [
      'Smart contract risks in the MakerDAO system',
      'Collateral volatility risks',
      'Governance risks from MKR token holders',
      'Potential for de-pegging during extreme market conditions'
    ],
    benefits: [
      'Decentralized governance through MakerDAO',
      'Transparent collateral backing visible on-chain',
      'Not directly subject to traditional banking regulations',
      'Widely accepted across DeFi protocols'
    ]
  },
  'WETH': {
    name: 'Wrapped Ether',
    description: 'WETH is a tokenized version of Ether (ETH) that conforms to the ERC-20 standard, allowing it to be used in DeFi protocols that require ERC-20 compatibility.',
    type: 'Wrapped Asset',
    riskLevel: 'Medium',
    volatility: 'High',
    backingType: '1:1 ETH backing',
    marketCap: 'Varies with ETH price',
    website: 'https://weth.io',
    explorer: 'https://polygonscan.com/token/0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    useCase: 'WETH is used for trading, providing liquidity, and as collateral in various DeFi protocols on Polygon.',
    risks: [
      'Price volatility of the underlying ETH',
      'Smart contract risks in the wrapping mechanism',
      'Bridge risks when moving between Ethereum and Polygon',
      'Market risks associated with ETH price movements'
    ],
    benefits: [
      'ERC-20 compatibility for use in DeFi protocols',
      'Backed 1:1 by ETH',
      'Potential for price appreciation along with ETH',
      'Widely accepted across DeFi protocols'
    ]
  }
};

export function TokenInfo({ symbol }: TokenInfoProps) {
  const token = tokenData[symbol as keyof typeof tokenData];
  
  if (!token) {
    return null;
  }

  const getRiskColor = (riskLevel: string) => {
    if (riskLevel.includes('Low')) return 'text-green-400';
    if (riskLevel.includes('Medium')) return 'text-yellow-400';
    if (riskLevel.includes('High')) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="default" className="h-6 w-6 rounded-full p-0 ml-2">
          <HelpCircle size={14} />
          <span className="sr-only">Learn about {symbol}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl">{token.name} ({symbol})</DialogTitle>
          <DialogDescription className="text-gray-400">
            Learn more about this token and its characteristics
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-300">Description</h4>
            <p className="text-gray-400 mt-1">{token.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-300">Type</h4>
              <p className="text-gray-400 mt-1">{token.type}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Risk Level</h4>
              <p className={`mt-1 ${getRiskColor(token.riskLevel)}`}>{token.riskLevel}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Volatility</h4>
              <p className="text-gray-400 mt-1">{token.volatility}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Backing</h4>
              <p className="text-gray-400 mt-1">{token.backingType}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300">Use Cases</h4>
            <p className="text-gray-400 mt-1">{token.useCase}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1">
                <ShieldCheck size={16} className="text-green-400" />
                <h4 className="font-medium text-gray-300">Benefits</h4>
              </div>
              <ul className="text-gray-400 mt-1 list-disc pl-5">
                {token.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="flex items-center gap-1">
                <AlertTriangle size={16} className="text-yellow-400" />
                <h4 className="font-medium text-gray-300">Risks</h4>
              </div>
              <ul className="text-gray-400 mt-1 list-disc pl-5">
                {token.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-2">
            <a href={token.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink size={14} />
                Website
              </Button>
            </a>
            <a href={token.explorer} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink size={14} />
                Explorer
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
