'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '../ui/dialog';
import { ExternalLink, Search, Filter, ArrowUpDown, DollarSign, Percent, Info, PlusCircle, Wallet } from 'lucide-react';
import { LiquidityPair } from '@/app/api/polygon/liquidity-pairs/route';

// Define the DeFi Llama pool structure
interface DefiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy?: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  poolMeta?: string;
  url?: string;
}

// Risk assessment types
type RiskLevel = 'low' | 'medium' | 'high' | 'very-high';

interface RiskAssessment {
  level: RiskLevel;
  score: number;
  reasons: string[];
  recommendedTimeframe?: string;
  warnings?: string[];
}

// Format currency with commas and 2 decimal places
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Function to add pool to portfolio
const addToPortfolio = (pool: DefiLlamaPool, investment: number): boolean => {
  // Check if localStorage is available (client-side)
  if (typeof window === 'undefined') return false;
  
  const savedPortfolio = localStorage.getItem('yield-snap-portfolio');
  let portfolio = savedPortfolio ? JSON.parse(savedPortfolio) : {
    investments: [],
    totalInvested: 0,
    totalCurrentValue: 0,
    totalEarnings: 0,
    averageApy: 0,
  };
  
  const id = `inv-${Date.now()}`;
  const apy = pool.apy || pool.apyBase || 0;
  const dailyRate = apy / 365 / 100;
  const dailyEarning = investment * dailyRate;
  
  const newInvestment = {
    id,
    poolId: pool.pool,
    poolName: pool.symbol,
    protocol: pool.project,
    amount: investment,
    apy: apy,
    startDate: new Date().toISOString().split('T')[0],
    dailyEarnings: [dailyEarning],
    totalEarnings: 0,
    currentValue: investment,
  };
  
  const updatedInvestments = [...portfolio.investments, newInvestment];
  const totalInvested = updatedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalEarnings = totalCurrentValue - totalInvested;
  const averageApy = updatedInvestments.reduce((sum, inv) => sum + (inv.apy * inv.amount), 0) / totalInvested;
  
  const updatedPortfolio = {
    investments: updatedInvestments,
    totalInvested,
    totalCurrentValue,
    totalEarnings,
    averageApy,
  };
  
  localStorage.setItem('yield-snap-portfolio', JSON.stringify(updatedPortfolio));
  
  return true;
};

// Format percentage with 2 decimal places
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Assess risk level of a pool based on various factors
const assessPoolRisk = (pool: DefiLlamaPool): RiskAssessment => {
  const apy = pool.apy || pool.apyBase || 0;
  const tvl = pool.tvlUsd;
  
  // Initialize risk assessment
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  
  // Assess APY risk (higher APY = higher risk)
  if (apy > 100) {
    score += 40;
    reasons.push(`Extremely high APY (${apy.toFixed(2)}%) suggests potential unsustainability`);
    warnings.push('APYs this high are often temporary and may drop significantly');
  } else if (apy > 50) {
    score += 30;
    reasons.push(`Very high APY (${apy.toFixed(2)}%) may indicate higher risk`);
  } else if (apy > 20) {
    score += 15;
    reasons.push(`Above average APY (${apy.toFixed(2)}%)`);
  }
  
  // Assess TVL risk (lower TVL = higher risk)
  if (tvl < 50000) {
    score += 30;
    reasons.push(`Low TVL ($${(tvl/1000).toFixed(0)}k) suggests limited liquidity`);
    warnings.push('Low liquidity pools are more susceptible to price manipulation');
  } else if (tvl < 250000) {
    score += 20;
    reasons.push(`Moderate TVL ($${(tvl/1000).toFixed(0)}k)`);
  } else if (tvl < 1000000) {
    score += 10;
    reasons.push(`Good TVL ($${(tvl/1000000).toFixed(2)}M)`);
  }
  
  // Assess protocol recognition (subjective)
  const majorProtocols = ['uniswap', 'aave', 'curve', 'balancer', 'compound', 'sushiswap', 'quickswap'];
  if (!majorProtocols.includes(pool.project.toLowerCase())) {
    score += 15;
    reasons.push(`Less established protocol (${pool.project})`);
  }
  
  // Determine risk level based on score
  let level: RiskLevel = 'low';
  let recommendedTimeframe = 'Long-term investment (3+ months) recommended';
  
  if (score >= 70) {
    level = 'very-high';
    recommendedTimeframe = 'Short-term only (days to weeks), monitor closely';
    warnings.push('This pool has a very high risk profile, proceed with extreme caution');
  } else if (score >= 45) {
    level = 'high';
    recommendedTimeframe = 'Medium-term (weeks to a month), regular monitoring advised';
  } else if (score >= 25) {
    level = 'medium';
    recommendedTimeframe = 'Medium to long-term (1-3 months)';
  }
  
  return {
    level,
    score,
    reasons,
    recommendedTimeframe,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

// Format currency with commas and 2 decimal places
const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}k`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

export function DefiLlamaPoolFinder({ pair }: { pair: LiquidityPair }) {
  const [pools, setPools] = useState<DefiLlamaPool[]>([]);
  const [filteredPools, setFilteredPools] = useState<DefiLlamaPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'tvlUsd' | 'apy'>('apy');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // State for portfolio integration
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000);
  const [showPortfolioSuccess, setShowPortfolioSuccess] = useState<boolean>(false);
  const [selectedPoolForPortfolio, setSelectedPoolForPortfolio] = useState<DefiLlamaPool | null>(null);
  const [investmentTimeframe, setInvestmentTimeframe] = useState<number>(30);
  const [isAddToPortfolioOpen, setIsAddToPortfolioOpen] = useState<boolean>(false);

  // Fetch pools from DeFi Llama API
  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/defi-llama/pools?chain=polygon&minTvl=10000`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPools(data);
      
      // Initial filtering based on pair tokens
      const token0Symbol = pair.token0.symbol.toLowerCase();
      const token1Symbol = pair.token1.symbol.toLowerCase();
      
      const initialFiltered = data.filter((pool: DefiLlamaPool) => {
        const poolSymbol = pool.symbol.toLowerCase();
        return poolSymbol.includes(token0Symbol) && poolSymbol.includes(token1Symbol);
      });
      
      setFilteredPools(initialFiltered);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort pools based on selected field and direction
  const sortPools = (poolsToSort: DefiLlamaPool[]) => {
    return [...poolsToSort].sort((a, b) => {
      if (sortField === 'tvlUsd') {
        if (sortDirection === 'asc') {
          return a.tvlUsd - b.tvlUsd;
        } else {
          return b.tvlUsd - a.tvlUsd;
        }
      } else {
        const aApy = a.apy || a.apyBase || 0;
        const bApy = b.apy || b.apyBase || 0;
        
        if (sortDirection === 'asc') {
          return aApy - bApy;
        } else {
          return bApy - aApy;
        }
      }
    });
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      // Reset to initial filtering based on pair tokens
      const token0Symbol = pair.token0.symbol.toLowerCase();
      const token1Symbol = pair.token1.symbol.toLowerCase();
      
      const initialFiltered = pools.filter((pool) => {
        const poolSymbol = pool.symbol.toLowerCase();
        return poolSymbol.includes(token0Symbol) && poolSymbol.includes(token1Symbol);
      });
      
      setFilteredPools(initialFiltered);
    } else {
      // Filter pools based on search term
      const filtered = pools.filter((pool) => {
        return (
          pool.symbol.toLowerCase().includes(term) ||
          pool.project.toLowerCase().includes(term)
        );
      });
      
      setFilteredPools(filtered);
    }
  };

  // Toggle sort direction
  const toggleSort = (field: 'tvlUsd' | 'apy') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Fetch pools on component mount
  useEffect(() => {
    fetchPools();
  }, []);

  // Calculate projected earnings for a pool based on investment amount and timeframe
  const calculateProjectedEarnings = (pool: DefiLlamaPool) => {
    const apy = pool.apy || pool.apyBase || 0;
    const dailyRate = apy / 365 / 100;
    const dailyEarnings = investmentAmount * dailyRate;
    const projectedEarnings = investmentAmount * Math.pow(1 + dailyRate, investmentTimeframe) - investmentAmount;
    const totalValue = investmentAmount + projectedEarnings;
    
    return {
      dailyEarnings,
      projectedEarnings,
      totalValue
    };
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Find More Yield Opportunities
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Find Yield Opportunities</DialogTitle>
            <DialogDescription>
              Search for yield farming opportunities for {pair.token0.symbol}-{pair.token1.symbol} pair across DeFi protocols
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by pool or protocol..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleSort('apy')}>
                <Percent className="mr-1 h-4 w-4" />
                APY
                {sortField === 'apy' && (
                  <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleSort('tvlUsd')}>
                <DollarSign className="mr-1 h-4 w-4" />
                TVL
                {sortField === 'tvlUsd' && (
                  <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {loading ? 'Loading pools...' : `${filteredPools.length} pools found`}
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <Label htmlFor="investment-amount" className="text-sm">Investment:</Label>
                    <Input
                      id="investment-amount"
                      type="number"
                      className="w-24 h-8"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <Label htmlFor="investment-timeframe" className="text-sm">Days:</Label>
                    <Input
                      id="investment-timeframe"
                      type="number"
                      className="w-16 h-8"
                      value={investmentTimeframe}
                      onChange={(e) => setInvestmentTimeframe(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Button disabled variant="outline">
                  Loading pools...
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Pool</th>
                      <th className="text-left py-2 px-4">Protocol</th>
                      <th className="text-right py-2 px-4">TVL</th>
                      <th className="text-right py-2 px-4">APY</th>
                      <th className="text-right py-2 px-4">Est. Earnings</th>
                      <th className="text-right py-2 px-4">Risk</th>
                      <th className="text-right py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortPools(filteredPools).map((pool) => {
                      const risk = assessPoolRisk(pool);
                      const earnings = calculateProjectedEarnings(pool);
                      
                      // Set risk level styles
                      const riskStyles = {
                        'low': 'bg-green-100 text-green-800',
                        'medium': 'bg-yellow-100 text-yellow-800',
                        'high': 'bg-orange-100 text-orange-800',
                        'very-high': 'bg-red-100 text-red-800'
                      }[risk.level];
                      
                      return (
                        <tr key={pool.pool} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{pool.symbol}</div>
                            {pool.poolMeta && <div className="text-xs text-muted-foreground">{pool.poolMeta}</div>}
                          </td>
                          <td className="py-3 px-4">{pool.project}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pool.tvlUsd)}</td>
                          <td className="py-3 px-4 text-right text-green-600 font-medium">
                            {formatPercentage(pool.apy || pool.apyBase || 0)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="text-green-600 font-medium">
                              {formatCurrencyCompact(earnings.projectedEarnings)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrencyCompact(earnings.dailyEarnings)}/day
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end">
                              <div className={`px-2 py-1 rounded-md text-xs font-medium ${riskStyles}`}>
                                {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 ml-1 p-0">
                                    <Info className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Risk Assessment</DialogTitle>
                                    <DialogDescription>Risk level: {risk.level}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="bg-muted/50 p-3 rounded-md">
                                      <div className="text-xl font-bold mb-2">
                                        Risk Score: {risk.score}/100
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div 
                                          className={`h-2.5 rounded-full ${risk.level === 'low' ? 'bg-green-500' : risk.level === 'medium' ? 'bg-yellow-500' : risk.level === 'high' ? 'bg-orange-500' : 'bg-red-500'}`}
                                          style={{ width: `${risk.score}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-1">Risk factors:</h4>
                                      <ul className="list-disc pl-5 text-sm space-y-1">
                                        {risk.reasons.map((reason, idx) => (
                                          <li key={idx}>{reason}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    {risk.warnings && risk.warnings.length > 0 && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                        <h4 className="font-medium mb-1 text-amber-800">Warnings:</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1 text-amber-800">
                                          {risk.warnings.map((warning, idx) => (
                                            <li key={idx}>{warning}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    <div>
                                      <h4 className="font-medium mb-1">Recommended timeframe:</h4>
                                      <p className="text-sm">{risk.recommendedTimeframe}</p>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-1">Investment Projection:</h4>
                                      <table className="w-full text-sm">
                                        <tbody>
                                          <tr>
                                            <td className="py-1">Initial investment:</td>
                                            <td className="text-right">${investmentAmount.toLocaleString()}</td>
                                          </tr>
                                          <tr>
                                            <td className="py-1">Expected earnings ({investmentTimeframe} days):</td>
                                            <td className="text-right text-green-600">${earnings.projectedEarnings.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="py-1 font-medium">Total value:</td>
                                            <td className="text-right font-medium">${earnings.totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pool.url ? (
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={() => window.open(pool.url, '_blank')}>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Farm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedPoolForPortfolio(pool);
                                    setIsAddToPortfolioOpen(true);
                                  }}
                                >
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                  Track
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={() => window.open(`https://defillama.com/yields/pool/${encodeURIComponent(pool.pool)}`, '_blank')}>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedPoolForPortfolio(pool);
                                    setIsAddToPortfolioOpen(true);
                                  }}
                                >
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                  Track
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              onClick={() => window.open(`https://defillama.com/yields?chain=Polygon&project=${encodeURIComponent(pair.protocol)}`, '_blank')}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Pools on DeFi Llama
            </Button>
            <Button
              onClick={() => window.open(`/portfolio`, '_blank')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              View Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Portfolio Dialog */}
      <Dialog open={isAddToPortfolioOpen} onOpenChange={setIsAddToPortfolioOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Portfolio</DialogTitle>
            <DialogDescription>
              Track this yield farming opportunity in your portfolio
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedPoolForPortfolio && (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/30">
                  <div className="font-medium text-lg">{selectedPoolForPortfolio.symbol}</div>
                  <div className="text-sm text-muted-foreground">{selectedPoolForPortfolio.project}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">TVL</div>
                      <div>{formatCurrency(selectedPoolForPortfolio.tvlUsd)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">APY</div>
                      <div className="text-green-600">
                        {formatPercentage(selectedPoolForPortfolio.apy || selectedPoolForPortfolio.apyBase || 0)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="portfolio-investment-amount">Investment Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="portfolio-investment-amount"
                      type="number"
                      placeholder="1000"
                      className="pl-8"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                {showPortfolioSuccess && (
                  <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                    Added to portfolio successfully! You can now track this investment in your portfolio.
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToPortfolioOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (selectedPoolForPortfolio && investmentAmount > 0) {
                  const success = addToPortfolio(selectedPoolForPortfolio, investmentAmount);
                  if (success) {
                    setShowPortfolioSuccess(true);
                    setTimeout(() => {
                      setShowPortfolioSuccess(false);
                      setIsAddToPortfolioOpen(false);
                    }, 2000);
                  }
                }
              }}
              disabled={!selectedPoolForPortfolio || investmentAmount <= 0}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add to Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
