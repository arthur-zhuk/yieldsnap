'use client';

import { useState, useEffect } from 'react';
import { usePublicClient, useAccount, useBlockNumber } from 'wagmi';
import { formatUnits } from 'viem';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { estimateGasForDeposit } from '@/lib/services/polygonService';

// Types for yield data
export interface YieldOpportunity {
  protocol: string;
  asset: string;
  symbol: string;
  apr: number;
  tvl: number;
  userBalance: number;
  depositUrl: string;
  contractAddress?: string; // Contract address for gas estimation
  estimatedGasCost?: string; // Estimated gas cost in MATIC
  estimatedFee?: number; // Estimated fee amount (0.5%)
}

interface YieldTableProps {
  opportunities: YieldOpportunity[];
  onDeposit: (opportunity: YieldOpportunity) => void;
  isLoading: boolean;
}

export function YieldTable({ opportunities, onDeposit, isLoading }: YieldTableProps) {
  const [sortField, setSortField] = useState<keyof YieldOpportunity>('apr');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [opportunitiesWithEstimates, setOpportunitiesWithEstimates] = useState<YieldOpportunity[]>(opportunities);
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Calculate fees and estimate gas costs
  useEffect(() => {
    if (!opportunities.length || !address) return;

    const calculateEstimates = async () => {
      const updatedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          // Calculate 0.5% fee
          const fee = opportunity.userBalance * 0.005;
          
          // Default gas cost
          let gasCost = "~0.01 MATIC";
          
          try {
            if (opportunity.contractAddress && opportunity.userBalance > 0) {
              // Use the real-time gas estimation from Polygon
              gasCost = await estimateGasForDeposit(
                opportunity.protocol,
                opportunity.asset === 'USDC' ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' :
                opportunity.asset === 'DAI' ? '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' :
                opportunity.asset === 'WETH' ? '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' : '',
                opportunity.userBalance,
                address
              );
            }
          } catch (error) {
            console.error('Error estimating gas:', error);
          }
          
          return {
            ...opportunity,
            estimatedGasCost: gasCost,
            estimatedFee: fee,
          };
        })
      );
      
      setOpportunitiesWithEstimates(updatedOpportunities);
    };
    
    calculateEstimates();
  }, [opportunities, address, blockNumber]);

  const sortedOpportunities = [...opportunitiesWithEstimates].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const handleSort = (field: keyof YieldOpportunity) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading yield opportunities...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No yield opportunities found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Connect your wallet to see yield opportunities for your assets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Yield Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th 
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort('protocol')}
                  >
                    Protocol
                    {sortField === 'protocol' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort('asset')}
                  >
                    Asset
                    {sortField === 'asset' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => handleSort('apr')}
                  >
                    APR
                    {sortField === 'apr' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => handleSort('userBalance')}
                  >
                    Your Balance
                    {sortField === 'userBalance' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-4 py-2 text-right">Fee (0.5%)</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedOpportunities.map((opportunity, index) => (
                  <tr key={`${opportunity.protocol}-${opportunity.asset}-${index}`} className="border-b border-border">
                    <td className="px-4 py-2">{opportunity.protocol}</td>
                    <td className="px-4 py-2">{opportunity.symbol}</td>
                    <td className="px-4 py-2 text-right">{opportunity.apr.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right">{opportunity.userBalance.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      {opportunity.estimatedFee !== undefined 
                        ? `${opportunity.estimatedFee.toFixed(2)} ${opportunity.symbol}`
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => onDeposit(opportunity)}
                            disabled={opportunity.userBalance <= 0}
                          >
                            Deposit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gas Cost: {opportunity.estimatedGasCost || 'Unknown'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 