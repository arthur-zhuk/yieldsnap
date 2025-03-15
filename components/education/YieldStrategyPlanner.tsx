'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Clock, TrendingUp, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { YieldOpportunity } from '@/components/yield-scanner/YieldTable';

interface YieldStrategyPlannerProps {
  opportunity: YieldOpportunity;
  onClose: () => void;
}

export function YieldStrategyPlanner({ opportunity, onClose }: YieldStrategyPlannerProps) {
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000);
  const [timeHorizon, setTimeHorizon] = useState<number>(90); // days
  const [reinvestYield, setReinvestYield] = useState<boolean>(true);
  
  // Calculate gas costs (entry and exit)
  // Use a type assertion to handle the estimatedGasFee property that might not be in the interface
  const opportunityWithFee = opportunity as (YieldOpportunity & { estimatedGasFee?: string });
  const entryGasCost = opportunityWithFee.estimatedGasFee ? parseFloat(opportunityWithFee.estimatedGasFee.replace('$', '')) : 
                     (opportunity.estimatedGasCost ? parseFloat(opportunity.estimatedGasCost.replace(' MATIC', '').replace('~', '')) * 0.5 : 5);
  const exitGasCost = entryGasCost * 0.8; // Estimate exit gas cost as 80% of entry
  const totalGasCost = entryGasCost + exitGasCost;
  
  // Calculate daily rate and earnings
  const dailyRate = opportunity.apr / 365 / 100;
  
  // Ensure we're using a reasonable APR value for visualization
  const effectiveApr = opportunity.apr > 0 ? opportunity.apr : 5; // Default to 5% if APR is zero or negative
  
  // Generate projection data
  const generateProjectionData = () => {
    const data = [];
    let currentAmount = investmentAmount;
    let cumulativeYield = 0;
    const effectiveDailyRate = effectiveApr / 365 / 100;
    
    for (let day = 0; day <= timeHorizon; day++) {
      // Calculate daily yield based on current principal amount
      const dailyYield = currentAmount * effectiveDailyRate;
      cumulativeYield += dailyYield;
      
      if (reinvestYield) {
        // For compound interest, add the yield back to the principal
        currentAmount += dailyYield;
      }
      
      const netProfit = cumulativeYield - totalGasCost;
      
      data.push({
        day,
        totalValue: reinvestYield ? currentAmount : investmentAmount + cumulativeYield,
        cumulativeYield,
        netProfit,
      });
    }
    
    return data;
  };
  
  const projectionData = generateProjectionData();
  
  // Calculate break-even point
  const breakEvenDay = projectionData.findIndex(d => d.netProfit > 0);
  
  // Calculate optimal exit point (simplified)
  // For this example, we'll use a simple heuristic: exit when daily yield growth rate falls below a threshold
  // In a real app, this would be more sophisticated
  const calculateOptimalExitDay = () => {
    if (reinvestYield) {
      // For compounding, optimal exit is usually longer
      return Math.max(breakEvenDay * 2, timeHorizon * 0.7);
    } else {
      // For non-compounding, exit after reasonable profit
      return Math.max(breakEvenDay * 1.5, timeHorizon * 0.5);
    }
  };
  
  const optimalExitDay = Math.round(calculateOptimalExitDay());
  const optimalExitProfit = optimalExitDay < projectionData.length 
    ? projectionData[optimalExitDay].netProfit 
    : projectionData[projectionData.length - 1].netProfit;
  
  // Calculate risk factors
  const protocolRisk = opportunity.protocol === 'Aave' ? 'Low' : 
                      opportunity.protocol === 'Compound' ? 'Low' : 'Medium';
  
  const tokenRisk = opportunity.asset === 'USDC' || opportunity.asset === 'DAI' ? 'Low' : 'Medium';
  
  return (
    <Card className="w-full bg-gray-900 border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Yield Strategy Planner</CardTitle>
        <CardDescription className="text-gray-400">
          Plan your entry and exit strategy for {opportunity.protocol} {opportunity.asset} yield farming
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Reinvest Yield</label>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={reinvestYield}
                onChange={(e) => setReinvestYield(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <span className="text-gray-300">Compound returns</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="font-medium mb-4">Yield Projection</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={projectionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="day" 
                  label={{ value: 'Days', position: 'insideBottomRight', offset: -5 }}
                  stroke="#888"
                />
                <YAxis 
                  label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }}
                  stroke="#888"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalValue" 
                  name="Total Value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="netProfit" 
                  name="Net Profit" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }} 
                />
                <ReferenceLine 
                  x={breakEvenDay} 
                  stroke="orange" 
                  label={{ value: 'Break-even', position: 'top', fill: 'orange' }} 
                />
                <ReferenceLine 
                  x={optimalExitDay} 
                  stroke="cyan" 
                  label={{ value: 'Optimal Exit', position: 'top', fill: 'cyan' }} 
                />
                <ReferenceLine y={0} stroke="red" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <h3 className="font-medium mb-3">Key Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">APR:</span>
                <span className="font-medium">{opportunity.apr.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Yield:</span>
                <span className="font-medium">${(investmentAmount * dailyRate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gas Costs (Entry + Exit):</span>
                <span className="font-medium">${totalGasCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Break-even Day:</span>
                <span className="font-medium">{breakEvenDay > 0 ? breakEvenDay : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projected Profit (at exit):</span>
                <span className="font-medium">${optimalExitProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <h3 className="font-medium mb-3">Strategy Recommendations</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-gray-300 font-medium">Entry Strategy</h4>
                <p className="text-gray-400 text-sm mt-1">
                  {investmentAmount < 500 
                    ? "Your investment amount is relatively small. Consider increasing it to offset gas costs more effectively."
                    : "Your investment amount is sufficient to offset gas costs within a reasonable timeframe."}
                </p>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium">Exit Strategy</h4>
                <p className="text-gray-400 text-sm mt-1">
                  Optimal exit around day {optimalExitDay} for maximum efficiency.
                  {optimalExitDay > timeHorizon 
                    ? " Consider extending your time horizon to reach optimal profitability."
                    : ""}
                </p>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium">Risk Assessment</h4>
                <p className="text-gray-400 text-sm mt-1">
                  Protocol Risk: <span className={protocolRisk === 'Low' ? 'text-green-400' : 'text-yellow-400'}>{protocolRisk}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  Token Risk: <span className={tokenRisk === 'Low' ? 'text-green-400' : 'text-yellow-400'}>{tokenRisk}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-800 pt-4 flex justify-between">
        <p className="text-xs text-gray-500">
          This is an educational tool and does not constitute financial advice.
        </p>
        <Button onClick={onClose}>Close</Button>
      </CardFooter>
    </Card>
  );
}
