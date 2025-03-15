'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '../ui/dialog';

// UI Components - using any type to avoid dependency issues
const Tabs: any = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const TabsContent: any = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const TabsList: any = ({ children, ...props }: any) => <div className="flex space-x-2 mb-4" {...props}>{children}</div>;
const TabsTrigger: any = ({ children, ...props }: any) => <button className="px-4 py-2 rounded-md" {...props}>{children}</button>;

const Badge: any = ({ children, variant, ...props }: any) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant === 'outline' ? 'border border-current' : 'bg-primary text-primary-foreground'}`} {...props}>{children}</span>
);

const Slider: any = ({ value, onValueChange, ...props }: any) => (
  <input type="range" value={value} onChange={(e) => onValueChange([parseInt(e.target.value)])} {...props} />
);

const Input: any = (props: any) => <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...props} />;

const Label: any = ({ children, ...props }: any) => <label className="text-sm font-medium" {...props}>{children}</label>;

// Custom Select component implementation
const Select: any = ({ children, value, onValueChange, ...props }: any) => {
  return (
    <div className="relative" {...props}>
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)} 
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {/* Directly render option elements */}
        {React.Children.map(React.Children.toArray(children), (child: any) => {
          if (child?.type === SelectContent) {
            return React.Children.map(child.props.children, (option: any) => {
              if (option?.type === SelectItem) {
                return <option value={option.props.value}>{option.props.children}</option>;
              }
              return null;
            });
          }
          return null;
        })}
      </select>
    </div>
  );
};

// These components are just for compatibility with the original code structure
const SelectTrigger: any = ({ children, ...props }: any) => null; // Not used in select
const SelectValue: any = ({ children, ...props }: any) => null; // Not used in select
const SelectContent: any = ({ children, ...props }: any) => <div style={{ display: 'none' }}>{children}</div>; // Hidden container for SelectItems
const SelectItem: any = ({ children, value, ...props }: any) => <div data-value={value} {...props}>{children}</div>; // Data structure for options
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DefiLlamaPoolFinder } from './DefiLlamaPoolFinder';
import { Info, HelpCircle, TrendingUp, ArrowUpRight, ExternalLink, Shield, DollarSign, BarChart3 } from 'lucide-react';


// Import the LiquidityPair interface
interface LiquidityPair {
  pairAddress: string;
  token0: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    price: number;
  };
  token1: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    price: number;
  };
  protocol: string;
  tvl: number;
  apr: number;
  rewardTokens: {
    symbol: string;
    address: string;
    rewardRate: number;
    price: number;
  }[];
  riskLevel: 'low' | 'medium' | 'high';
  farmUrl: string;
  swapUrl: string;
  fee: number;
  volume24h: number;
  volumeChange7d: number;
  profitProjection?: {
    feesEarned: number;
    rewardsEarned: number;
    totalProfit: number;
    impermanentLoss: number;
    netProfit: number;
    roi: number;
    apy: number;
    riskAdjustedReturn: number;
    qualityScore: number;
    rewardTokenBreakdown: {
      symbol: string;
      amount: number;
      value: number;
    }[];
  };
  riskScore?: number;
}

interface LiquidityPairScannerProps {
  onPairSelect?: (pair: LiquidityPair) => void;
}

export function LiquidityPairScanner({ onPairSelect }: LiquidityPairScannerProps) {
  const [liquidityPairs, setLiquidityPairs] = useState<LiquidityPair[]>([]);
  const [filteredPairs, setFilteredPairs] = useState<LiquidityPair[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPair, setSelectedPair] = useState<LiquidityPair | null>(null);
  const [showProfitCalculator, setShowProfitCalculator] = useState<boolean>(false);
  const { address } = useAccount();

  // Filter settings
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [minTvl, setMinTvl] = useState<number>(0);
  const [minApr, setMinApr] = useState<number>(0);
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000);
  const [timeHorizon, setTimeHorizon] = useState<number>(30);
  const [sortBy, setSortBy] = useState<string>('qualityScore'); // Default to quality score
  const [showHealthyOnly, setShowHealthyOnly] = useState<boolean>(false);
  const [minQualityScore, setMinQualityScore] = useState<number>(0);

  // Fetch liquidity pairs data
  const fetchLiquidityPairs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (riskLevel !== 'all') params.append('riskLevel', riskLevel);
      if (minTvl > 0) params.append('minTvl', minTvl.toString());
      if (minApr > 0) params.append('minApr', minApr.toString());
      params.append('investmentAmount', investmentAmount.toString());
      params.append('timeHorizon', timeHorizon.toString());
      params.append('sortBy', sortBy);
      params.append('showHealthyOnly', showHealthyOnly.toString());
      if (minQualityScore > 0) params.append('minQualityScore', minQualityScore.toString());

      const response = await fetch(`/api/polygon/liquidity-pairs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch liquidity pairs');
      }
      const data = await response.json();
      setLiquidityPairs(data.pairs);
      // No need to sort again as the API already sorts based on the sortBy parameter
      setFilteredPairs(data.pairs);
    } catch (error) {
      console.error('Error fetching liquidity pairs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort pairs based on selected criteria
  const sortPairs = (pairs: LiquidityPair[], sortCriteria: string) => {
    let sorted = [...pairs];
    switch (sortCriteria) {
      case 'apr':
        sorted.sort((a, b) => b.apr - a.apr);
        break;
      case 'tvl':
        sorted.sort((a, b) => b.tvl - a.tvl);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'profit':
        sorted.sort((a, b) => (b.profitProjection?.totalProfit || 0) - (a.profitProjection?.totalProfit || 0));
        break;
      case 'risk':
        sorted.sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0));
        break;
      default:
        sorted.sort((a, b) => b.apr - a.apr);
    }
    setFilteredPairs(sorted);
  };

  // Apply filters
  const applyFilters = () => {
    fetchLiquidityPairs();
  };

  // Reset filters
  const resetFilters = () => {
    setRiskLevel('all');
    setMinTvl(0);
    setMinApr(0);
    setInvestmentAmount(1000);
    setTimeHorizon(30);
    setSortBy('apr');
  };

  // Handle pair selection
  const handlePairSelect = (pair: LiquidityPair) => {
    setSelectedPair(pair);
    if (onPairSelect) {
      onPairSelect(pair);
    }
  };

  // Generate profit projection data for chart
  const generateProfitProjectionData = (pair: LiquidityPair) => {
    if (!pair.profitProjection) return [];

    const data = [];
    const dailyGrossProfit = pair.profitProjection.totalProfit / timeHorizon;
    const dailyImpermanentLoss = pair.profitProjection.impermanentLoss / timeHorizon;
    const dailyNetProfit = pair.profitProjection.netProfit / timeHorizon;
    
    let cumulativeGrossProfit = 0;
    let cumulativeImpermanentLoss = 0;
    let cumulativeNetProfit = 0;

    for (let day = 0; day <= timeHorizon; day += Math.max(1, Math.floor(timeHorizon / 10))) {
      cumulativeGrossProfit = dailyGrossProfit * day;
      cumulativeImpermanentLoss = dailyImpermanentLoss * day;
      cumulativeNetProfit = dailyNetProfit * day;
      
      data.push({
        day,
        grossProfit: cumulativeGrossProfit,
        impermanentLoss: cumulativeImpermanentLoss,
        netProfit: cumulativeNetProfit,
        fees: (pair.profitProjection.feesEarned / timeHorizon) * day,
        rewards: (pair.profitProjection.rewardsEarned / timeHorizon) * day,
      });
    }

    // Always include the final day
    if (data[data.length - 1]?.day !== timeHorizon) {
      cumulativeGrossProfit = dailyGrossProfit * timeHorizon;
      cumulativeImpermanentLoss = dailyImpermanentLoss * timeHorizon;
      cumulativeNetProfit = dailyNetProfit * timeHorizon;
      
      data.push({
        day: timeHorizon,
        grossProfit: cumulativeGrossProfit,
        impermanentLoss: cumulativeImpermanentLoss,
        netProfit: cumulativeNetProfit,
        fees: pair.profitProjection.feesEarned,
        rewards: pair.profitProjection.rewardsEarned,
      });
    }

    return data;
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format large numbers with K, M, B suffixes
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  // Get risk color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  // Load initial data
  useEffect(() => {
    fetchLiquidityPairs();
  }, []);

  // Update sorting when sort criteria changes
  useEffect(() => {
    if (liquidityPairs.length > 0) {
      sortPairs(liquidityPairs, sortBy);
    }
  }, [sortBy, liquidityPairs]);

  return (
    <TooltipProvider>
      <Card className="w-full bg-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Liquidity Pair Scanner
          </CardTitle>
          <CardDescription>
            Find and analyze liquidity pairs with low to medium risk for yield farming
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="mb-6 bg-muted/50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-3">Filter Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger id="riskLevel" className="w-full">
                    <SelectValue placeholder="Select Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minTvl">Min TVL (USD)</Label>
                <Input
                  id="minTvl"
                  type="number"
                  value={minTvl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinTvl(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="minApr">Min APR (%)</Label>
                <Input
                  id="minApr"
                  type="number"
                  value={minApr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinApr(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy" className="w-full">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apr">APR</SelectItem>
                    <SelectItem value="tvl">TVL</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="profit">Profit Potential</SelectItem>
                    <SelectItem value="risk">Risk (Lowest First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="investmentAmount">Investment Amount (USD)</Label>
                <Input
                  id="investmentAmount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvestmentAmount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="timeHorizon">Time Horizon (Days)</Label>
                <Input
                  id="timeHorizon"
                  type="number"
                  value={timeHorizon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeHorizon(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-card/50">
            <table className="w-full border-collapse min-w-[800px] divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Pair</th>
                  <th className="px-4 py-3 text-left font-medium">Protocol</th>
                  <th className="px-4 py-3 text-right font-medium">APR</th>
                  <th className="px-4 py-3 text-right font-medium">TVL</th>
                  <th className="px-4 py-3 text-right font-medium">24h Volume</th>
                  <th className="px-4 py-3 text-center font-medium">Risk</th>
                  <th className="px-4 py-3 text-center font-medium">
                    <div className="flex items-center justify-center">
                      Quality
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 rounded-full p-0 ml-1">
                            <HelpCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Quality score (0-100) combines risk assessment and return potential</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <div className="flex items-center justify-end">
                      Est. Net Profit
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 rounded-full p-0 ml-1">
                            <HelpCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Net profit after accounting for fees, rewards, and impermanent loss</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right font-medium w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      Loading liquidity pairs...
                    </td>
                  </tr>
                ) : filteredPairs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      No liquidity pairs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPairs.map((pair, index) => (
                    <tr key={pair.pairAddress} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{pair.token0.symbol}/{pair.token1.symbol}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 rounded-full p-0">
                                <Info className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{pair.token0.name}/{pair.token1.name}</p>
                              <p className="text-xs mt-1">Pair Address: {pair.pairAddress.substring(0, 8)}...{pair.pairAddress.substring(pair.pairAddress.length - 6)}</p>
                              <p className="text-xs mt-1">Fee: {pair.fee}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-4 py-3">{pair.protocol}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-medium">{pair.apr.toFixed(2)}%</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 rounded-full p-0">
                                <TrendingUp className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Annual Percentage Rate</p>
                              <p className="text-xs mt-1">Includes trading fees and reward tokens</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">${formatLargeNumber(pair.tvl)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span>${formatLargeNumber(pair.volume24h)}</span>
                          <span className={pair.volumeChange7d >= 0 ? "text-green-500" : "text-red-500"}>
                            {pair.volumeChange7d >= 0 ? "+" : ""}{pair.volumeChange7d.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Badge className={`${getRiskColor(pair.riskLevel)}`}>
                            {pair.riskLevel.charAt(0).toUpperCase() + pair.riskLevel.slice(1)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pair.profitProjection ? (
                          <div className="flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-medium">
                              {Math.round(pair.profitProjection.qualityScore)}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pair.profitProjection ? (
                          <div>
                            <span className="font-medium">{formatCurrency(pair.profitProjection.netProfit)}</span>
                            <div className="text-xs text-muted-foreground flex items-center justify-end">
                              <span className="text-green-500 mr-1">+{formatCurrency(pair.profitProjection.totalProfit)}</span>
                              <span className="text-red-500">-{formatCurrency(pair.profitProjection.impermanentLoss)}</span>
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handlePairSelect(pair);
                              setShowProfitCalculator(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Analyze
                          </Button>
                          <DefiLlamaPoolFinder pair={pair} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Profit Calculator Dialog */}
          {selectedPair && showProfitCalculator && (
            <Dialog open={showProfitCalculator} onOpenChange={setShowProfitCalculator}>
              <DialogContent className="sm:max-w-[800px] bg-card">
                <DialogTitle className="text-xl flex items-center mb-2">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Yield Farming Profit Calculator
                </DialogTitle>
                <DialogDescription>
                  Calculate potential profits from yield farming with {selectedPair.token0.symbol}/{selectedPair.token1.symbol} on {selectedPair.protocol}.
                </DialogDescription>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 bg-muted/50 p-4 rounded-md">
                    <div>
                      <h3 className="font-medium text-lg">{selectedPair.token0.symbol}/{selectedPair.token1.symbol}</h3>
                      <p className="text-muted-foreground">{selectedPair.protocol}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        <span>Risk Level: </span>
                        <Badge className={`ml-2 ${getRiskColor(selectedPair.riskLevel)}`}>
                          {selectedPair.riskLevel.charAt(0).toUpperCase() + selectedPair.riskLevel.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>APR: {selectedPair.apr.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="calc-investment">Investment Amount (USD)</Label>
                        <Input
                          id="calc-investment"
                          type="number"
                          value={investmentAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvestmentAmount(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="calc-timeHorizon">Time Horizon (Days)</Label>
                        <Input
                          id="calc-timeHorizon"
                          type="number"
                          value={timeHorizon}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeHorizon(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          // Recalculate with new parameters
                          fetchLiquidityPairs();
                        }}
                      >
                        Recalculate
                      </Button>

                      <div className="bg-muted/50 p-4 rounded-md space-y-2 mt-4">
                        <h4 className="font-medium">Profit Breakdown</h4>
                        {selectedPair.profitProjection && (
                          <>
                            <div className="flex justify-between">
                              <span>Trading Fees:</span>
                              <span>{formatCurrency(selectedPair.profitProjection.feesEarned)}</span>
                            </div>
                            
                            {/* Reward Tokens Section with Detailed Breakdown */}
                            <div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span>Reward Tokens:</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" className="h-6 w-6 rounded-full p-0 ml-1">
                                        <HelpCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Tokens earned as incentives for providing liquidity</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="font-medium">{formatCurrency(selectedPair.profitProjection.rewardsEarned)}</span>
                              </div>
                              
                              {/* Detailed Reward Token Breakdown */}
                              <div className="ml-4 mt-1 text-sm space-y-1">
                                {selectedPair.profitProjection.rewardTokenBreakdown.map((reward, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span className="text-muted-foreground">{reward.symbol}:</span>
                                    <span>
                                      {reward.amount.toFixed(4)} ({formatCurrency(reward.value)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="border-t border-border pt-2 mt-2 flex justify-between font-medium text-green-500">
                              <span>Total Gross Profit:</span>
                              <span>{formatCurrency(selectedPair.profitProjection.totalProfit)}</span>
                            </div>
                            
                            {/* Impermanent Loss Section */}
                            <div className="flex justify-between text-red-500">
                              <div className="flex items-center">
                                <span>Impermanent Loss:</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" className="h-6 w-6 rounded-full p-0 ml-1">
                                      <HelpCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[300px]">
                                    <p>Impermanent Loss occurs when the price ratio of your deposited tokens changes compared to when you deposited them. This is an estimate based on historical price volatility.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <span>-{formatCurrency(selectedPair.profitProjection.impermanentLoss)}</span>
                            </div>
                            
                            <div className="border-t border-border pt-2 mt-2 flex justify-between font-medium text-lg">
                              <span>Net Profit:</span>
                              <span>{formatCurrency(selectedPair.profitProjection.netProfit)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>ROI:</span>
                              <span>{selectedPair.profitProjection.roi.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Annualized:</span>
                              <span>{selectedPair.profitProjection.apy.toFixed(2)}% APY</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Risk-Adjusted Return:</span>
                              <span>{selectedPair.profitProjection.riskAdjustedReturn.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Quality Score:</span>
                              <span>{selectedPair.profitProjection.qualityScore.toFixed(0)}/100</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-md">
                      <h4 className="font-medium mb-4">Profit Projection</h4>
                      <div className="h-64">
                        {selectedPair.profitProjection && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={generateProfitProjectionData(selectedPair)}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                              <XAxis
                                dataKey="day"
                                label={{ value: 'Days', position: 'insideBottomRight', offset: -5 }}
                                stroke="#888"
                              />
                              <YAxis
                                label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }}
                                stroke="#888"
                              />
                              <RechartsTooltip
                                contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                                formatter={(value: number, name: string) => [
                                  `$${value.toFixed(2)}`,
                                  name === 'netProfit' ? 'Net Profit' : 
                                  name === 'grossProfit' ? 'Gross Profit' : 
                                  name === 'impermanentLoss' ? 'Impermanent Loss' : 
                                  name === 'fees' ? 'Trading Fees' : 'Reward Tokens'
                                ]}
                                labelFormatter={(label) => `Day ${label}`}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="netProfit"
                                name="Net Profit"
                                stroke="#8884d8"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="grossProfit"
                                name="Gross Profit"
                                stroke="#82ca9d"
                                strokeWidth={1.5}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="impermanentLoss"
                                name="Impermanent Loss"
                                stroke="#ff6b6b"
                                strokeWidth={1.5}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="fees"
                                name="Trading Fees"
                                stroke="#4dabf7"
                                strokeWidth={1}
                                dot={false}
                                strokeDasharray="3 3"
                              />
                              <Line
                                type="monotone"
                                dataKey="rewards"
                                name="Reward Tokens"
                                stroke="#ffc658"
                                strokeWidth={1}
                                dot={false}
                                strokeDasharray="3 3"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedPair.swapUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Swap Tokens
                    </Button>
                    <Button
                      onClick={() => window.open(selectedPair.farmUrl, '_blank')}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Start Farming
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
