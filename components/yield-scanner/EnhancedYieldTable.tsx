'use client';

import { useState, useEffect } from 'react';
import { usePublicClient, useAccount, useBlockNumber } from 'wagmi';
import { formatUnits } from 'viem';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '../ui/dialog';
import { estimateGasForDeposit } from '@/lib/services/polygonService';
import { YieldEducation } from '../education/YieldEducation';
import { ProtocolInfo } from '../education/ProtocolInfo';
import { TokenInfo } from '../education/TokenInfo';
import { GasFeeExplainer } from '../education/GasFeeExplainer';
import { YieldAdvisor } from '../education/YieldAdvisor';
import { YieldStrategyPlanner } from '../education/YieldStrategyPlanner';
import { Info, HelpCircle, TrendingUp, Calculator, LineChart } from 'lucide-react';

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
  estimatedGasFee?: string; // Estimated gas fee in USD
  estimatedFee?: number; // Estimated fee amount (0.5%)
}

interface EnhancedYieldTableProps {
  opportunities: YieldOpportunity[];
  onDeposit: (opportunity: YieldOpportunity) => void;
  isLoading: boolean;
}

export function EnhancedYieldTable({ opportunities, onDeposit, isLoading }: EnhancedYieldTableProps) {
  const [sortField, setSortField] = useState<keyof YieldOpportunity>('apr');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [opportunitiesWithEstimates, setOpportunitiesWithEstimates] = useState<YieldOpportunity[]>(opportunities);
  const [selectedOpportunity, setSelectedOpportunity] = useState<YieldOpportunity | null>(null);
  const [showStrategyPlanner, setShowStrategyPlanner] = useState<boolean>(false);
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
          let gasFeeUSD = "$0.50";
          
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
              
              // Estimate USD value (simplified - in a real app we would fetch MATIC price)
              const maticPrice = 0.5; // Assuming $0.50 per MATIC
              const maticAmount = parseFloat(gasCost.replace(' MATIC', '').replace('~', ''));
              gasFeeUSD = `$${(maticAmount * maticPrice).toFixed(2)}`;
            }
          } catch (error) {
            console.error('Error estimating gas:', error);
          }
          
          return {
            ...opportunity,
            estimatedGasCost: gasCost,
            estimatedGasFee: gasFeeUSD,
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
    <>
      <YieldEducation />
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle>Yield Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto rounded-md border border-border bg-card/50">
              <table className="w-full border-collapse min-w-[800px] divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th 
                      className="px-4 py-3 text-left cursor-pointer font-medium"
                      onClick={() => handleSort('protocol')}
                    >
                      Protocol
                      {sortField === 'protocol' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer font-medium"
                      onClick={() => handleSort('asset')}
                    >
                      Asset
                      {sortField === 'asset' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer font-medium w-[120px]"
                      onClick={() => handleSort('apr')}
                    >
                      APR
                      {sortField === 'apr' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer font-medium w-[150px]"
                      onClick={() => handleSort('userBalance')}
                    >
                      Your Balance
                      {sortField === 'userBalance' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-right font-medium w-[100px]">Fee (0.5%)</th>
                    <th className="px-4 py-3 text-right font-medium w-[200px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedOpportunities.map((opportunity, index) => (
                    <tr key={`${opportunity.protocol}-${opportunity.asset}-${index}`} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <ProtocolInfo protocol={opportunity.protocol} />
                          <span className="truncate">{opportunity.protocol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TokenInfo symbol={opportunity.symbol} />
                          <span className="truncate">{opportunity.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-medium">{opportunity.apr.toFixed(2)}%</span>
                          <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 rounded-full p-0">
                              <TrendingUp className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Annual Percentage Rate - the yearly interest you'll earn</p>
                          </TooltipContent>
                        </Tooltip>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{opportunity.userBalance.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {opportunity.estimatedFee !== undefined 
                          ? `${opportunity.estimatedFee.toFixed(2)} ${opportunity.symbol}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <GasFeeExplainer gasFee={opportunity.estimatedGasFee || '$0.50'} />
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2 h-8 text-xs md:text-sm"
                                onClick={() => {
                                  setSelectedOpportunity(opportunity);
                                  setShowStrategyPlanner(false);
                                }}
                              >
                                <Calculator className="h-3.5 w-3.5 mr-1" />
                                Advisor
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Get personalized yield farming advice</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2 h-8 text-xs md:text-sm"
                                onClick={() => {
                                  setSelectedOpportunity(opportunity);
                                  setShowStrategyPlanner(true);
                                }}
                              >
                                <LineChart className="h-3.5 w-3.5 mr-1" />
                                Strategy
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Plan your yield farming strategy</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs md:text-sm"
                                onClick={() => onDeposit(opportunity)}
                                disabled={opportunity.userBalance <= 0}
                              >
                                Deposit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Gas Cost: {opportunity.estimatedGasCost || 'Unknown'}</p>
                              <p className="text-xs text-gray-400 mt-1">Click the lightning icon to learn more</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
      
      {/* Yield Advisor Dialog */}
      {selectedOpportunity && !showStrategyPlanner && (
        <Dialog open={!!selectedOpportunity} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
          <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white" aria-describedby="yield-advisor-description">
            <DialogTitle className="text-xl flex items-center mb-2">
              <Calculator className="h-5 w-5 mr-2" />
              Yield Farming Advisor
            </DialogTitle>
            <p id="yield-advisor-description" className="sr-only">Personalized recommendations for your yield farming strategy based on investment amount and time horizon.</p>
            <YieldAdvisor 
              opportunity={selectedOpportunity} 
              userBalance={selectedOpportunity.userBalance} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Strategy Planner Dialog */}
      {selectedOpportunity && showStrategyPlanner && (
        <Dialog open={!!selectedOpportunity && showStrategyPlanner} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
          <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-800 text-white" aria-describedby="strategy-planner-description">
            <DialogTitle className="text-xl flex items-center mb-2">
              <LineChart className="h-5 w-5 mr-2" />
              Yield Strategy Planner
            </DialogTitle>
            <p id="strategy-planner-description" className="sr-only">Interactive tool to plan and visualize your yield farming strategy over time.</p>
            <YieldStrategyPlanner 
              opportunity={selectedOpportunity} 
              onClose={() => setSelectedOpportunity(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
