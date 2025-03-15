'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, HelpCircle } from 'lucide-react';

interface ProtocolInfoProps {
  protocol: string;
}

const protocolData = {
  'Aave': {
    description: 'Aave is an open-source and non-custodial liquidity protocol for earning interest on deposits and borrowing assets.',
    riskLevel: 'Low to Medium',
    securityAudits: 'Multiple audits by firms like OpenZeppelin, SigmaPrime, and Trail of Bits',
    founded: '2017',
    tvl: '$5.4B+',
    website: 'https://aave.com',
    docs: 'https://docs.aave.com',
    features: [
      'Supply assets to earn interest',
      'Borrow assets against your collateral',
      'Variable and stable interest rates',
      'Flash loans for developers'
    ],
    howItWorks: 'When you deposit assets into Aave, you receive aTokens in return. These aTokens automatically earn interest based on the market borrowing demand. The interest rates adjust algorithmically based on supply and demand.'
  },
  'Compound': {
    description: 'Compound is an algorithmic money market protocol that allows users to lend and borrow crypto assets.',
    riskLevel: 'Low to Medium',
    securityAudits: 'Audited by Trail of Bits, OpenZeppelin, and Certora',
    founded: '2018',
    tvl: '$2.1B+',
    website: 'https://compound.finance',
    docs: 'https://docs.compound.finance',
    features: [
      'Supply assets to earn interest',
      'Borrow assets against your collateral',
      'Earn COMP governance tokens',
      'Participate in protocol governance'
    ],
    howItWorks: 'When you deposit assets into Compound, you receive cTokens that represent your deposit plus accrued interest. Interest rates are determined by supply and demand for each asset in the protocol.'
  }
};

export function ProtocolInfo({ protocol }: ProtocolInfoProps) {
  const protocolInfo = protocolData[protocol as keyof typeof protocolData];
  
  if (!protocolInfo) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0">
          <HelpCircle size={14} />
          <span className="sr-only">Learn about {protocol}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl">{protocol} Protocol</DialogTitle>
          <DialogDescription className="text-gray-400">
            Learn more about how {protocol} works and its features
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-300">Description</h4>
            <p className="text-gray-400 mt-1">{protocolInfo.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-300">Risk Level</h4>
              <p className="text-gray-400 mt-1">{protocolInfo.riskLevel}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Founded</h4>
              <p className="text-gray-400 mt-1">{protocolInfo.founded}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Total Value Locked</h4>
              <p className="text-gray-400 mt-1">{protocolInfo.tvl}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Security</h4>
              <p className="text-gray-400 mt-1">{protocolInfo.securityAudits}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300">How It Works</h4>
            <p className="text-gray-400 mt-1">{protocolInfo.howItWorks}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-300">Key Features</h4>
            <ul className="text-gray-400 mt-1 list-disc pl-5">
              {protocolInfo.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex space-x-4 pt-2">
            <a href={protocolInfo.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink size={14} />
                Visit Website
              </Button>
            </a>
            <a href={protocolInfo.docs} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink size={14} />
                Documentation
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
