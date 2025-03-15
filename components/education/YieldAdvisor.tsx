'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Clock, TrendingUp, ArrowRight, DollarSign } from 'lucide-react';
import { YieldOpportunity } from '@/components/yield-scanner/EnhancedYieldTable';

interface YieldAdvisorProps {
  opportunity: YieldOpportunity;
  userBalance: number;
}

export function YieldAdvisor({ opportunity, userBalance }: YieldAdvisorProps) {
  const [investmentAmount, setInvestmentAmount] = useState<number>(userBalance > 0 ? userBalance : 100);
  const [timeHorizon, setTimeHorizon] = useState<number>(30); // days
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // Calculate potential earnings
  const dailyRate = opportunity.apr / 365 / 100;
  
  // For high-value assets like WBTC, ensure we're calculating earnings properly
  // Use the asset price to convert to USD for more accurate calculations
  const assetPriceInUSD = opportunity.symbol === 'WBTC' ? 65000 : // Approximate BTC price
                          opportunity.symbol === 'WETH' ? 3500 : // Approximate ETH price
                          opportunity.symbol === 'USDC' || opportunity.symbol === 'USDT' || opportunity.symbol === 'DAI' ? 1 :
                          10; // Default value for other tokens
                          
  const investmentAmountUSD = investmentAmount * assetPriceInUSD;
  const dailyEarnings = investmentAmountUSD * dailyRate;
  const projectedEarnings = investmentAmountUSD * Math.pow((1 + dailyRate), timeHorizon) - investmentAmountUSD;
  
  // Calculate gas costs and break-even point
  const gasCostInUSD = opportunity.estimatedGasFee ? parseFloat(opportunity.estimatedGasFee.replace('$', '')) : 
                     (opportunity.estimatedGasCost ? parseFloat(opportunity.estimatedGasCost.replace(' MATIC', '').replace('~', '')) * 0.5 : 5);
                     
  // Ensure dailyEarnings is not zero or extremely small to avoid division issues
  // For high-value assets like WBTC, even small APRs can generate meaningful returns
  const minDailyEarnings = Math.max(dailyEarnings, 0.001); // Set minimum daily earnings to prevent unrealistic break-even calculations
  const breakEvenDays = gasCostInUSD / minDailyEarnings;
  
  // Determine if this is a good opportunity based on time horizon
  const isGoodOpportunity = timeHorizon > Math.ceil(breakEvenDays);
  
  // Optimal exit strategy
  const optimalExitDays = Math.max(Math.ceil(breakEvenDays) * 2, 14); // At least 2x break-even or 14 days
  
  // Calculate impermanent loss risk (simplified)
  const impermanentLossRisk = opportunity.protocol.toLowerCase().includes('swap') ? 'Medium' : 'Low';
  
  // Calculate risk-adjusted return
  const riskFactor = impermanentLossRisk === 'Low' ? 0.9 : 0.7;
  const riskAdjustedReturn = projectedEarnings * riskFactor;
  
  return (
    <Card className="w-full bg-gray-900 border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2" size={20} />
          Yield Farming Advisor
        </CardTitle>
        <CardDescription className="text-gray-400">
          Personalized recommendations for your yield farming strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Investment Amount ({opportunity.symbol})</label>
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Time Horizon (Days)</label>
          <input
            type="number"
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(parseInt(e.target.value) || 1)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
          />
        </div>
        
        <div className="mt-4 p-4 rounded bg-gray-800 border border-gray-700">
          <h3 className="font-medium text-lg flex items-center">
            <TrendingUp className="mr-2" size={18} />
            Yield Analysis
          </h3>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Earnings:</span>
              <span className="font-medium">${dailyEarnings.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Gas Cost:</span>
              <span className="font-medium">${gasCostInUSD.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Break-even Point:</span>
              <span className="font-medium">{Math.ceil(breakEvenDays)} days</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Projected Earnings ({timeHorizon} days):</span>
              <span className="font-medium">${projectedEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded ${isGoodOpportunity ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
          <h3 className="font-medium">Recommendation:</h3>
          {isGoodOpportunity ? (
            <p className="text-green-400 mt-1">
              ✓ This yield opportunity is profitable for your {timeHorizon}-day time horizon.
            </p>
          ) : (
            <p className="text-red-400 mt-1">
              ✗ This yield opportunity may not be profitable for your {timeHorizon}-day time horizon.
            </p>
          )}
          
          <Button 
            variant="ghost" 
            className="text-sm mt-2 text-gray-300 hover:text-white"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {showDetails && (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-300">Optimal Strategy:</h4>
                <p className="text-gray-400 mt-1">
                  For this opportunity, you should stay invested for at least {optimalExitDays} days to maximize returns.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-300">Risk Assessment:</h4>
                <p className="text-gray-400 mt-1">
                  Impermanent Loss Risk: <span className={impermanentLossRisk === 'Low' ? 'text-green-400' : 'text-yellow-400'}>{impermanentLossRisk}</span>
                </p>
                <p className="text-gray-400">
                  Risk-Adjusted Return: ${riskAdjustedReturn.toFixed(2)}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-300">Exit Strategy:</h4>
                <p className="text-gray-400 mt-1">
                  Consider exiting if APR drops below {(opportunity.apr * 0.7).toFixed(1)}% or after {optimalExitDays} days.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500">
          This is an educational tool and does not constitute financial advice. Always do your own research.
        </p>
      </CardFooter>
    </Card>
  );
}
