'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { Plus, Trash2, DollarSign, TrendingUp, Calendar, Wallet, PieChart, ArrowUpRight, BarChart3, Clock, RefreshCw } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

// Define the investment structure
interface Investment {
  id: string;
  poolId: string;
  poolName: string;
  protocol: string;
  amount: number;
  apy: number;
  startDate: string;
  dailyEarnings: number[];
  totalEarnings: number;
  currentValue: number;
  // Enhanced tracking for yield farming components
  impermanentLoss: number;
  tradingFees: number;
  rewardTokens: RewardToken[];
  riskScore: number; // 0-100
  volatility: number; // Historical price volatility
}

// Define reward token structure
interface RewardToken {
  symbol: string;
  amount: number;
  value: number;
  apr: number;
}

// Define the portfolio structure
interface Portfolio {
  investments: Investment[];
  totalInvested: number;
  totalCurrentValue: number;
  totalEarnings: number;
  averageApy: number;
}

// Define the portfolio health metrics
interface PortfolioHealth {
  diversificationScore: number; // 0-100
  riskScore: number; // 0-100
  performanceScore: number; // 0-100
  overallHealthScore: number; // 0-100
  topPerformer: string | null;
  underperformer: string | null;
  riskConcentration: string | null;
  recommendations: string[];
}

// Format currency with commas and 2 decimal places
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format percentage with 2 decimal places
const formatPercentage = (value: number): string => {
  // Ensure value is a number and not NaN
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${safeValue.toFixed(2)}%`;
};

// Helper function to safely access reward tokens
const safeRewardTokens = (investment: Investment): RewardToken[] => {
  if (!investment.rewardTokens || !Array.isArray(investment.rewardTokens)) {
    return [];
  }
  return investment.rewardTokens;
};

// Helper function to safely access numeric properties
const safeNumber = (value: any, defaultValue = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
};

// Helper functions for specific investment properties
const safeImpermanentLoss = (investment: Investment): number => safeNumber(investment.impermanentLoss);
const safeTradingFees = (investment: Investment): number => safeNumber(investment.tradingFees);
const safeVolatility = (investment: Investment): number => safeNumber(investment.volatility);
const safeRiskScore = (investment: Investment): number => safeNumber(investment.riskScore, 50);

// Helper function to safely calculate total reward value
const calculateTotalRewardValue = (investment: Investment): number => {
  return safeRewardTokens(investment).reduce((sum, token) => sum + token.value, 0);
};

export function PortfolioTracker() {
  const { toast } = useToast();
  // State to track and highlight recent changes
  const [recentChanges, setRecentChanges] = useState<{
    totalInvested: number;
    oldTotalValue: number;
    newTotalValue: number;
    oldTotalEarnings: number;
    newTotalEarnings: number;
    valueChange: number;
    earningsChange: number;
    date: string;
  } | null>(null);
  const [showChanges, setShowChanges] = useState<boolean>(false);
  // State for portfolio health metrics
  const [portfolioHealth, setPortfolioHealth] = useState<PortfolioHealth>({
    diversificationScore: 0,
    riskScore: 0,
    performanceScore: 0,
    overallHealthScore: 0,
    topPerformer: null,
    underperformer: null,
    riskConcentration: null,
    recommendations: [],
  });
  const [showHealthDashboard, setShowHealthDashboard] = useState<boolean>(false);
  // Initialize portfolio from localStorage or with default values
  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    if (typeof window !== 'undefined') {
      const savedPortfolio = localStorage.getItem('yield-snap-portfolio');
      if (savedPortfolio) {
        return JSON.parse(savedPortfolio);
      }
    }
    return {
      investments: [],
      totalInvested: 0,
      totalCurrentValue: 0,
      totalEarnings: 0,
      averageApy: 0,
    };
  });

  // Calculate risk score for an investment based on protocol, volatility, and APY
  const calculateInvestmentRiskScore = (
    protocol: string,
    volatility: number,
    apy: number
  ): number => {
    // Ensure inputs are valid numbers
    const safeVolatility = typeof volatility === 'number' && !isNaN(volatility) ? volatility : 5;
    const safeApy = typeof apy === 'number' && !isNaN(apy) ? apy : 5;
    
    // Base score starts at 50 (medium risk)
    let riskScore = 50;
    
    // Adjust based on protocol reputation (simplified)
    const protocolLower = (protocol || '').toLowerCase();
    if (['uniswap', 'curve', 'aave', 'compound'].some(p => protocolLower.includes(p))) {
      // Well-established protocols reduce risk
      riskScore -= 10;
    } else if (['sushiswap', 'balancer', 'yearn'].some(p => protocolLower.includes(p))) {
      // Moderately established protocols
      riskScore -= 5;
    } else if (['pancakeswap', 'quickswap'].some(p => protocolLower.includes(p))) {
      // Less established protocols
      riskScore += 5;
    } else {
      // Unknown or newer protocols increase risk
      riskScore += 10;
    }
    
    // Adjust based on volatility
    if (safeVolatility < 5) {
      riskScore -= 10; // Low volatility reduces risk
    } else if (safeVolatility > 20) {
      riskScore += 15; // High volatility increases risk
    } else if (safeVolatility > 10) {
      riskScore += 5; // Medium volatility slightly increases risk
    }
    
    // Adjust based on APY (very high APYs are often riskier)
    if (safeApy > 100) {
      riskScore += 20; // Very high APY is usually very risky
    } else if (safeApy > 50) {
      riskScore += 10; // High APY increases risk
    } else if (safeApy > 20) {
      riskScore += 5; // Moderate APY slightly increases risk
    }
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, riskScore));
  };

  // State for adding new investment
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    poolName: '',
    protocol: '',
    amount: 100,
    apy: 5,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    volatility: 5, // Default volatility (5%)
    rewardTokens: [] as RewardToken[],
  });

  // State for chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('30d');

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yield-snap-portfolio', JSON.stringify(portfolio));
      // Calculate portfolio health metrics whenever portfolio changes
      calculatePortfolioHealth();
    }
  }, [portfolio]);

  // Generate chart data based on portfolio investments
  useEffect(() => {
    generateChartData();
  }, [portfolio, timeframe]);

  // Generate chart data for the selected timeframe
  const generateChartData = () => {
    if (portfolio.investments.length === 0) {
      setChartData([]);
      return;
    }

    // Determine the number of days to show based on timeframe
    let days = 30;
    if (timeframe === '7d') days = 7;
    if (timeframe === '90d') days = 90;
    if (timeframe === '365d') days = 365;

    const today = new Date();
    const data = [];

    // Generate data for each day
    for (let i = 0; i < days; i++) {
      const date = addDays(today, -days + i + 1);
      const dateStr = format(date, 'MMM dd');
      
      const dayData: any = {
        date: dateStr,
        totalValue: 0,
        netProfit: 0,
        tradingFees: 0,
        rewardTokens: 0,
        impermanentLoss: 0
      };

      // Calculate value for each investment on this day
      portfolio.investments.forEach((investment, index) => {
        // Ensure investment has a valid startDate
        if (!investment.startDate) {
          console.warn('Investment missing startDate:', investment);
          return;
        }

        const investmentStartDate = new Date(investment.startDate);
        
        // Skip invalid dates
        if (isNaN(investmentStartDate.getTime())) {
          console.warn('Invalid investment startDate:', investment.startDate);
          return;
        }
        
        const daysSinceStart = differenceInDays(date, investmentStartDate);
        
        // Only include if the investment had started by this date
        if (daysSinceStart >= 0) {
          // Ensure we have valid numeric values
          const amount = typeof investment.amount === 'number' && !isNaN(investment.amount) ? investment.amount : 0;
          const apy = typeof investment.apy === 'number' && !isNaN(investment.apy) ? investment.apy : 0;
          const volatility = typeof investment.volatility === 'number' && !isNaN(investment.volatility) ? investment.volatility : 5;
          
          // Calculate base earnings using compound interest formula
          const dailyRate = apy / 365 / 100;
          const baseEarnings = amount * Math.pow(1 + dailyRate, daysSinceStart) - amount;
          
          // Calculate impermanent loss - increases over time based on volatility
          // More realistic model: IL grows with square root of time and is proportional to volatility
          const ilFactor = Math.sqrt(daysSinceStart / 30) * (volatility / 10); 
          const impermanentLoss = (amount * ilFactor * 0.01);
          
          // Calculate trading fees - typically 60-80% of yield in AMMs comes from fees
          const tradingFees = baseEarnings * 0.7; // 70% of earnings from trading fees
          
          // Calculate reward tokens - typically 20-40% of yield in AMMs comes from token rewards
          const rewardTokenValue = baseEarnings * 0.3; // 30% of earnings from reward tokens
          
          // Net profit is (trading fees + rewards - impermanent loss)
          const netProfit = tradingFees + rewardTokenValue - impermanentLoss;
          
          // Total value is initial investment plus net profit
          const value = amount + netProfit;
          
          // Update day data - accumulate values from all investments
          dayData.totalValue += value;
          dayData.netProfit += netProfit;
          dayData.tradingFees += tradingFees;
          dayData.rewardTokens += rewardTokenValue;
          dayData.impermanentLoss += impermanentLoss;
          dayData[`investment${index}`] = value;
        }
      });

      data.push(dayData);
    }

    setChartData(data);
  };

  // Add a new investment to the portfolio
  const addInvestment = () => {
    const id = `inv-${Date.now()}`;
    const dailyRate = newInvestment.apy / 365 / 100;
    const dailyEarning = newInvestment.amount * dailyRate;
    
    // Calculate initial values for new fields
    const estimatedVolatility = newInvestment.volatility || 5; // Default 5% if not specified
    
    // More accurate impermanent loss estimation based on volatility
    // IL is roughly proportional to volatility squared for small price changes
    const estimatedImpermanentLoss = (newInvestment.amount * Math.pow(estimatedVolatility/100, 2) * 25); 
    
    // Split yield between trading fees and reward tokens
    const estimatedTradingFees = dailyEarning * 0.7; // 70% of yield comes from trading fees
    const estimatedRewardValue = dailyEarning * 0.3; // 30% of yield comes from reward tokens
    
    // Create default reward tokens based on protocol
    const defaultRewardTokens: RewardToken[] = [];
    
    if (newInvestment.rewardTokens && newInvestment.rewardTokens.length > 0) {
      // Use provided reward tokens if available
      defaultRewardTokens.push(...newInvestment.rewardTokens);
    } else {
      // Create default reward token based on protocol
      if (newInvestment.protocol.toLowerCase().includes('uniswap')) {
        defaultRewardTokens.push({
          symbol: 'UNI',
          amount: estimatedRewardValue / 5, // Convert dollar value to token amount (assume $5 per token)
          value: estimatedRewardValue,
          apr: newInvestment.apy * 0.3 // 30% of APY comes from rewards
        });
      } else if (newInvestment.protocol.toLowerCase().includes('sushi')) {
        defaultRewardTokens.push({
          symbol: 'SUSHI',
          amount: estimatedRewardValue / 1.2, // Convert dollar value to token amount (assume $1.2 per token)
          value: estimatedRewardValue,
          apr: newInvestment.apy * 0.3 // 30% of APY comes from rewards
        });
      } else {
        // Generic protocol token
        defaultRewardTokens.push({
          symbol: `${newInvestment.protocol.substring(0, 4).toUpperCase()}`,
          amount: estimatedRewardValue / 2, // Convert dollar value to token amount (assume $2 per token)
          value: estimatedRewardValue,
          apr: newInvestment.apy * 0.3 // 30% of APY comes from rewards
        });
      }
    }
    
    // Calculate risk score based on protocol, volatility, and APY
    const riskScore = calculateInvestmentRiskScore(
      newInvestment.protocol,
      estimatedVolatility,
      newInvestment.apy
    );
    
    const investment: Investment = {
      id,
      poolId: id,
      poolName: newInvestment.poolName,
      protocol: newInvestment.protocol,
      amount: newInvestment.amount,
      apy: newInvestment.apy,
      startDate: newInvestment.startDate,
      dailyEarnings: [dailyEarning],
      totalEarnings: 0,
      currentValue: newInvestment.amount,
      impermanentLoss: estimatedImpermanentLoss,
      tradingFees: estimatedTradingFees,
      rewardTokens: defaultRewardTokens,
      riskScore: riskScore,
      volatility: estimatedVolatility
    };

    const updatedInvestments = [...portfolio.investments, investment];
    const totalInvested = updatedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEarnings = totalCurrentValue - totalInvested;
    const averageApy = updatedInvestments.reduce((sum, inv) => sum + (inv.apy * inv.amount), 0) / totalInvested;

    setPortfolio({
      investments: updatedInvestments,
      totalInvested,
      totalCurrentValue,
      totalEarnings,
      averageApy,
    });

    setIsAddingInvestment(false);
    setNewInvestment({
      poolName: '',
      protocol: '',
      amount: 100,
      apy: 5,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      volatility: 5,
      rewardTokens: [],
    });
  };

  // Remove an investment from the portfolio
  const removeInvestment = (id: string) => {
    const updatedInvestments = portfolio.investments.filter(inv => inv.id !== id);
    
    if (updatedInvestments.length === 0) {
      setPortfolio({
        investments: [],
        totalInvested: 0,
        totalCurrentValue: 0,
        totalEarnings: 0,
        averageApy: 0,
      });
      return;
    }

    const totalInvested = updatedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEarnings = totalCurrentValue - totalInvested;
    const averageApy = updatedInvestments.reduce((sum, inv) => sum + (inv.apy * inv.amount), 0) / totalInvested;

    setPortfolio({
      investments: updatedInvestments,
      totalInvested,
      totalCurrentValue,
      totalEarnings,
      averageApy,
    });
  };

  // State for simulation controls
  const [simulationDays, setSimulationDays] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [showSimulationDialog, setShowSimulationDialog] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [simulationHistory, setSimulationHistory] = useState<{date: string, value: number}[]>([]);
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false);
  const [simulationSummary, setSimulationSummary] = useState<{
    initialValue: number;
    finalValue: number;
    totalGrowth: number;
    percentageGrowth: number;
    dailyAverage: number;
    projectedAnnualReturn: number;
  } | null>(null);

  // Store the simulated portfolio for applying later
  const [simulatedPortfolioResult, setSimulatedPortfolioResult] = useState<Portfolio | null>(null);
  
  // Update portfolio with simulated daily earnings
  const simulateDailyUpdate = (days: number = 1, showProgress: boolean = false) => {
    if (days <= 0 || portfolio.investments.length === 0) return;
    
    if (showProgress) {
      setIsSimulating(true);
      setSimulationProgress(0);
      
      // Save initial state for history
      const initialDate = new Date();
      const initialValue = portfolio.totalCurrentValue;
      
      // Create a working copy of the portfolio to avoid state update issues
      let simulatedPortfolio = JSON.parse(JSON.stringify(portfolio));
      
      // Initialize simulation history
      const history = [{ 
        date: format(initialDate, 'MMM dd'), 
        value: initialValue 
      }];
      setSimulationHistory(history);
      
      // Determine speed (milliseconds between updates)
      const speedMap = {
        slow: 800,
        medium: 400,
        fast: 100
      };
      
      let currentDay = 0;
      const intervalId = setInterval(() => {
        if (currentDay >= days) {
          clearInterval(intervalId);
          setIsSimulating(false);
          
          // Store the final simulated portfolio for applying later if needed
          setSimulatedPortfolioResult(simulatedPortfolio);
          
          // Generate simulation summary
          if (history.length > 1) {
            const initialValue = history[0].value;
            const finalValue = history[history.length - 1].value;
            const totalGrowth = finalValue - initialValue;
            const percentageGrowth = (totalGrowth / initialValue) * 100;
            const dailyAverage = totalGrowth / days;
            const projectedAnnualReturn = (Math.pow((finalValue / initialValue), (365 / days)) - 1) * 100;
            
            setSimulationSummary({
              initialValue,
              finalValue,
              totalGrowth,
              percentageGrowth,
              dailyAverage,
              projectedAnnualReturn
            });
          }
          
          setSimulationComplete(true);
          return;
        }
        
        // Simulate one day on our working copy
        simulatedPortfolio = simulateSingleDayWithoutStateUpdate(simulatedPortfolio);
        currentDay++;
        
        // Update progress
        setSimulationProgress(Math.round((currentDay / days) * 100));
        
        // Add to history
        const newDate = new Date();
        newDate.setDate(initialDate.getDate() + currentDay);
        const newHistoryPoint = { 
          date: format(newDate, 'MMM dd'), 
          value: simulatedPortfolio.totalCurrentValue 
        };
        
        history.push(newHistoryPoint);
        setSimulationHistory([...history]);
      }, speedMap[simulationSpeed]);
      
      return () => clearInterval(intervalId);
    } else {
      // Simulate all days at once without animation
      let simulatedPortfolio = JSON.parse(JSON.stringify(portfolio));
      for (let i = 0; i < days; i++) {
        simulatedPortfolio = simulateSingleDayWithoutStateUpdate(simulatedPortfolio);
      }
      
      // Store the final simulated portfolio
      setSimulatedPortfolioResult(simulatedPortfolio);
      
      // Apply the simulation results to the actual portfolio
      setPortfolio(simulatedPortfolio);
      localStorage.setItem('yield-snap-portfolio', JSON.stringify(simulatedPortfolio));
      
      // Show success toast
      toast({
        title: "Simulation Applied",
        description: `Portfolio updated with ${days} days of simulated earnings`,
        variant: "success"
      });
    }
  };
  
  // Apply the simulated portfolio to the actual portfolio
  const applySimulationToPortfolio = () => {
    if (!simulatedPortfolioResult) return;
    
    // Create a visual indicator of what changed
    const oldPortfolio = {...portfolio};
    const newPortfolio = simulatedPortfolioResult;
    
    // Store the changes for highlighting
    const portfolioChanges = {
      totalInvested: oldPortfolio.totalInvested,
      oldTotalValue: oldPortfolio.totalCurrentValue,
      newTotalValue: newPortfolio.totalCurrentValue,
      oldTotalEarnings: oldPortfolio.totalEarnings,
      newTotalEarnings: newPortfolio.totalEarnings,
      valueChange: newPortfolio.totalCurrentValue - oldPortfolio.totalCurrentValue,
      earningsChange: newPortfolio.totalEarnings - oldPortfolio.totalEarnings,
      date: new Date().toISOString(),
    };
    
    // Apply the changes
    setPortfolio(newPortfolio);
    localStorage.setItem('yield-snap-portfolio', JSON.stringify(newPortfolio));
    
    // Store the changes for highlighting
    setRecentChanges(portfolioChanges);
    setShowChanges(true);
    
    // Auto-hide changes after 10 seconds
    setTimeout(() => setShowChanges(false), 10000);
    
    // Close dialog and reset simulation state
    setShowSimulationDialog(false);
    setSimulationComplete(false);
    setSimulationSummary(null);
    setSimulatedPortfolioResult(null);
    
    // Show success toast
    toast({
      title: "Simulation Applied",
      description: `Fast-forwarded portfolio by ${simulationDays} days, adding $${portfolioChanges.valueChange.toFixed(2)} in value`,
      variant: "success"
    });
  };
  
  // Simulate a single day without updating state (for visual simulation)
  const simulateSingleDayWithoutStateUpdate = (currentPortfolio: Portfolio): Portfolio => {
    // Exaggerate growth slightly for better visualization in the simulation
    // This is just for the visual simulation, not for actual calculations
    const growthMultiplier = 1.5; // Increase growth by 50% for better visualization
    
    const updatedInvestments = currentPortfolio.investments.map(investment => {
      // Ensure we have valid numeric values
      const amount = safeNumber(investment.amount, 0);
      const apy = safeNumber(investment.apy, 5);
      const currentValue = safeNumber(investment.currentValue, amount);
      const totalEarnings = safeNumber(investment.totalEarnings, 0);
      const impermanentLoss = safeNumber(investment.impermanentLoss, 0);
      const tradingFees = safeNumber(safeTradingFees(investment), 0);
      
      // Calculate base earnings using APY
      const dailyRate = (apy / 365 / 100) * growthMultiplier;
      const dailyEarning = currentValue * dailyRate; // Compound interest
      
      // Calculate impermanent loss for this day (increases over time)
      // IL is proportional to volatility and increases with time
      let daysSinceStart = 1;
      try {
        if (investment.startDate) {
          const startDate = new Date(investment.startDate);
          if (!isNaN(startDate.getTime())) {
            daysSinceStart = differenceInDays(new Date(), startDate) + 1;
            // Ensure daysSinceStart is at least 1 to avoid division by zero
            daysSinceStart = Math.max(1, daysSinceStart);
          }
        }
      } catch (e) {
        console.error('Error calculating days since start:', e);
      }
      
      const dailyImpermanentLoss = (impermanentLoss / Math.sqrt(daysSinceStart)) * 0.1;
      
      // Calculate trading fees (70% of earnings)
      const dailyTradingFees = dailyEarning * 0.7;
      
      // Calculate reward tokens (30% of earnings)
      const dailyRewardValue = dailyEarning * 0.3;
      
      // Update reward tokens - handle potential errors
      let updatedRewardTokens = [];
      try {
        updatedRewardTokens = safeRewardTokens(investment).map(token => {
          const tokenValue = safeNumber(token.value, 1);
          const tokenAmount = safeNumber(token.amount, 0);
          return {
            ...token,
            amount: tokenAmount + (dailyRewardValue / tokenValue) * tokenAmount,
            value: tokenValue + dailyRewardValue
          };
        });
      } catch (e) {
        console.error('Error updating reward tokens:', e);
        updatedRewardTokens = safeRewardTokens(investment);
      }
      
      // Calculate net earnings (trading fees + rewards - impermanent loss)
      const netDailyEarning = dailyTradingFees + dailyRewardValue - dailyImpermanentLoss;
      const newTotalEarnings = totalEarnings + netDailyEarning;
      const newCurrentValue = amount + newTotalEarnings;
      
      return {
        ...investment,
        dailyEarnings: [...(investment.dailyEarnings || []), netDailyEarning],
        totalEarnings: newTotalEarnings,
        currentValue: newCurrentValue,
        impermanentLoss: impermanentLoss + dailyImpermanentLoss,
        tradingFees: tradingFees + dailyTradingFees,
        rewardTokens: updatedRewardTokens.length > 0 ? updatedRewardTokens : investment.rewardTokens
      };
    });

    const totalInvested = updatedInvestments.reduce((sum, inv) => sum + safeNumber(inv.amount, 0), 0);
    const totalCurrentValue = updatedInvestments.reduce((sum, inv) => sum + safeNumber(inv.currentValue, 0), 0);
    const totalEarnings = totalCurrentValue - totalInvested;
    const averageApy = totalInvested > 0 ? 
      updatedInvestments.reduce((sum, inv) => sum + (safeNumber(inv.apy, 0) * safeNumber(inv.amount, 0)), 0) / totalInvested : 0;

    return {
      investments: updatedInvestments,
      totalInvested,
      totalCurrentValue,
      totalEarnings,
      averageApy,
    };
  };
  
  // Simulate a single day update
  const simulateSingleDay = () => {
    const updatedInvestments = portfolio.investments.map(investment => {
      const dailyRate = investment.apy / 365 / 100;
      const dailyEarning = investment.currentValue * dailyRate; // Compound interest
      const newTotalEarnings = investment.totalEarnings + dailyEarning;
      const newCurrentValue = investment.amount + newTotalEarnings;
      
      return {
        ...investment,
        dailyEarnings: [...investment.dailyEarnings, dailyEarning],
        totalEarnings: newTotalEarnings,
        currentValue: newCurrentValue,
      };
    });

    const totalInvested = updatedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEarnings = totalCurrentValue - totalInvested;
    const averageApy = updatedInvestments.reduce((sum, inv) => sum + (inv.apy * inv.amount), 0) / totalInvested;

    setPortfolio({
      ...portfolio,
      investments: updatedInvestments,
      totalCurrentValue,
      totalEarnings,
      averageApy,
    });
  };

  // Calculate ROI percentage
  const calculateRoi = () => {
    if (portfolio.totalInvested === 0) return 0;
    return (portfolio.totalEarnings / portfolio.totalInvested) * 100;
  };

  // Calculate portfolio health metrics
  const calculatePortfolioHealth = () => {
    if (portfolio.investments.length === 0) {
      setPortfolioHealth({
        diversificationScore: 0,
        riskScore: 0,
        performanceScore: 0,
        overallHealthScore: 0,
        topPerformer: null,
        underperformer: null,
        riskConcentration: null,
        recommendations: ["Add your first investment to see portfolio health metrics."],
      });
      return;
    }

    // Calculate diversification score based on protocol distribution and number of investments
    const protocols = new Set(portfolio.investments.map(inv => inv.protocol));
    const protocolDistribution: Record<string, number> = {};
    
    portfolio.investments.forEach(inv => {
      protocolDistribution[inv.protocol] = (protocolDistribution[inv.protocol] || 0) + inv.amount;
    });
    
    // Calculate Herfindahl-Hirschman Index (HHI) for concentration
    const totalInvested = portfolio.totalInvested;
    const hhi = Object.values(protocolDistribution).reduce((sum, amount) => {
      const marketShare = amount / totalInvested;
      return sum + (marketShare * marketShare);
    }, 0);
    
    // Convert HHI to a diversification score (lower HHI = better diversification)
    // HHI ranges from 1/n (perfect diversification) to 1 (complete concentration)
    // We want a score from 0-100 where 100 is best
    const perfectHHI = 1 / protocols.size;
    const worstHHI = 1;
    const normalizedHHI = (hhi - perfectHHI) / (worstHHI - perfectHHI);
    const diversificationScore = Math.round((1 - normalizedHHI) * 100);
    
    // Calculate risk score based on APY levels (higher APY usually means higher risk)
    // We'll use a weighted average where higher APYs contribute more to risk
    const riskScore = Math.min(100, Math.round(portfolio.investments.reduce((score, inv) => {
      // APYs above 20% are considered increasingly risky
      const apyRiskFactor = inv.apy > 20 ? (inv.apy / 20) : (inv.apy / 40);
      return score + (apyRiskFactor * (inv.amount / totalInvested) * 100);
    }, 0)));
    
    // Calculate performance score based on ROI and APY efficiency
    const roi = calculateRoi();
    const averageApy = portfolio.averageApy;
    const performanceScore = Math.min(100, Math.round((roi / averageApy) * 50 + (roi > 0 ? 50 : 0)));
    
    // Calculate overall health score as a weighted average
    const overallHealthScore = Math.round(
      (diversificationScore * 0.4) + // Diversification is important
      (Math.max(0, 100 - riskScore) * 0.3) + // Lower risk is better
      (performanceScore * 0.3) // Higher performance is better
    );
    
    // Find top performer and underperformer
    let topPerformer = null;
    let underperformer = null;
    let maxRoi = -Infinity;
    let minRoi = Infinity;
    
    portfolio.investments.forEach(inv => {
      const invRoi = (inv.totalEarnings / inv.amount) * 100;
      if (invRoi > maxRoi) {
        maxRoi = invRoi;
        topPerformer = inv.poolName;
      }
      if (invRoi < minRoi) {
        minRoi = invRoi;
        underperformer = inv.poolName;
      }
    });
    
    // Find risk concentration
    const riskConcentration = Object.entries(protocolDistribution)
      .sort((a, b) => b[1] - a[1])[0];
    const concentrationPercentage = (riskConcentration[1] / totalInvested) * 100;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (diversificationScore < 50) {
      recommendations.push(`Consider diversifying beyond ${riskConcentration[0]} (${concentrationPercentage.toFixed(1)}% of portfolio).`);
    }
    
    if (riskScore > 70) {
      recommendations.push("Your portfolio has high-risk investments. Consider balancing with some lower-APY stable options.");
    }
    
    if (portfolio.investments.length < 3) {
      recommendations.push("Add more investments to improve diversification and reduce risk.");
    }
    
    if (underperformer && maxRoi - minRoi > 10) {
      recommendations.push(`Consider reallocating funds from ${underperformer} to better performing investments.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Your portfolio is well-balanced. Continue monitoring performance.");
    }
    
    setPortfolioHealth({
      diversificationScore,
      riskScore,
      performanceScore,
      overallHealthScore,
      topPerformer,
      underperformer: underperformer !== topPerformer ? underperformer : null,
      riskConcentration: `${riskConcentration[0]} (${concentrationPercentage.toFixed(1)}%)`,
      recommendations,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Yield Farming Portfolio</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddingInvestment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
          <Button variant="outline" onClick={() => setShowSimulationDialog(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Simulate Earnings
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowHealthDashboard(true)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Portfolio Health
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <h3 className="text-2xl font-bold">{formatCurrency(portfolio.totalInvested)}</h3>
              </div>
              <Wallet className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={showChanges && recentChanges ? 'border-green-500 dark:border-green-400 border-2 transition-all duration-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">{formatCurrency(portfolio.totalCurrentValue)}</h3>
                  {showChanges && recentChanges && (
                    <span className="text-sm font-medium text-green-600 animate-pulse">
                      +{formatCurrency(recentChanges.valueChange)}
                    </span>
                  )}
                </div>
                {showChanges && recentChanges && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Fast-forwarded portfolio
                  </p>
                )}
              </div>
              <DollarSign className={`h-8 w-8 ${showChanges && recentChanges ? 'text-green-600' : 'text-primary'} opacity-80`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={showChanges && recentChanges ? 'border-green-500 dark:border-green-400 border-2 transition-all duration-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-green-600">{formatCurrency(portfolio.totalEarnings)}</h3>
                  {showChanges && recentChanges && (
                    <span className="text-sm font-medium text-green-600 animate-pulse">
                      +{formatCurrency(recentChanges.earningsChange)}
                    </span>
                  )}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <h3 className="text-2xl font-bold text-primary">{formatPercentage(calculateRoi())}</h3>
              </div>
              <PieChart className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Portfolio Performance</CardTitle>
            <div className="flex space-x-1">
              <Button 
                variant={timeframe === '7d' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeframe('7d')}
              >
                7D
              </Button>
              <Button 
                variant={timeframe === '30d' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeframe('30d')}
              >
                30D
              </Button>
              <Button 
                variant={timeframe === '90d' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeframe('90d')}
              >
                90D
              </Button>
              <Button 
                variant={timeframe === '365d' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeframe('365d')}
              >
                1Y
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorTradingFees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRewardTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9C27B0" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorImpermanentLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F44336" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F44336" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      // Check for NaN and use 0 instead
                      const safeValue = isNaN(value) ? 0 : value;
                      
                      // Format value as currency
                      const formattedValue = `$${safeValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`;
                      
                      // Map internal data keys to user-friendly display names
                      let displayName = name;
                      switch(name) {
                        case 'totalValue':
                          displayName = 'Portfolio Value';
                          break;
                        case 'netProfit':
                          displayName = 'Net Profit';
                          break;
                        case 'tradingFees':
                          displayName = 'Trading Fees';
                          break;
                        case 'rewardTokens':
                          displayName = 'Reward Tokens';
                          break;
                        case 'impermanentLoss':
                          displayName = 'Impermanent Loss';
                          break;
                      }
                      
                      return [formattedValue, displayName];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend formatter={(value) => {
                    // Custom legend formatter to add visual indicators
                    switch(value) {
                      case 'Portfolio Value':
                        return <span>Portfolio Value</span>;
                      case 'Net Profit':
                        return <span>Net Profit</span>;
                      case 'Trading Fees':
                        return <span>Trading Fees</span>;
                      case 'Reward Tokens':
                        return <span>Reward Tokens</span>;
                      case 'Impermanent Loss':
                        return <span>Impermanent Loss</span>;
                      default:
                        return value;
                    }
                  }} />
                  <Area 
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    name="Portfolio Value"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="netProfit" 
                    stroke="#4CAF50" 
                    fillOpacity={0.5} 
                    fill="url(#colorNetProfit)" 
                    name="Net Profit"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tradingFees" 
                    stroke="#2196F3" 
                    fillOpacity={0.5} 
                    fill="url(#colorTradingFees)" 
                    name="Trading Fees"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rewardTokens" 
                    stroke="#9C27B0" 
                    fillOpacity={0.5} 
                    fill="url(#colorRewardTokens)" 
                    name="Reward Tokens"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="impermanentLoss" 
                    stroke="#F44336" 
                    fillOpacity={0.5} 
                    fill="url(#colorImpermanentLoss)" 
                    name="Impermanent Loss"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center items-center h-80 bg-muted/20 rounded-md">
              <p className="text-muted-foreground">Add investments to see performance chart</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Investments</CardTitle>
          <CardDescription>
            Track all your yield farming investments and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.investments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Pool</th>
                    <th className="text-left py-2 px-4">Protocol</th>
                    <th className="text-right py-2 px-4">Invested</th>
                    <th className="text-right py-2 px-4">APY</th>
                    <th className="text-right py-2 px-4">Current Value</th>
                    <th className="text-right py-2 px-4">Net Earnings</th>
                    <th className="text-right py-2 px-4">Risk Score</th>
                    <th className="text-right py-2 px-4">Details</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.investments.map((investment) => {
                    const dailyEarning = investment.dailyEarnings[investment.dailyEarnings.length - 1];
                    // Use the safe helper function to calculate total reward value
                    const totalRewardValue = calculateTotalRewardValue(investment);
                    
                    // Calculate risk color based on risk score
                    const getRiskColor = (score: number) => {
                      if (score < 30) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                      if (score < 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                    };
                    
                    return (
                      <React.Fragment key={investment.id}>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{investment.poolName}</td>
                          <td className="py-3 px-4">{investment.protocol}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(investment.amount)}</td>
                          <td className="py-3 px-4 text-right">{formatPercentage(investment.apy)}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(investment.currentValue)}</td>
                          <td className="py-3 px-4 text-right text-green-600 font-medium">
                            {formatCurrency(investment.totalEarnings)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(investment.riskScore)}`}>
                              {investment.riskScore}/100
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Position Details: {investment.poolName}</DialogTitle>
                                </DialogHeader>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                  {/* Left column - Basic info */}
                                  <div className="space-y-4">
                                    <div className="bg-muted/50 p-4 rounded-md">
                                      <h4 className="font-medium mb-2">Position Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Protocol:</span>
                                          <span className="font-medium">{investment.protocol}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Investment Date:</span>
                                          <span>{investment.startDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Initial Investment:</span>
                                          <span>{formatCurrency(investment.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Current Value:</span>
                                          <span className="font-medium">{formatCurrency(investment.currentValue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Total Earnings:</span>
                                          <span className="text-green-600">{formatCurrency(investment.totalEarnings)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Daily Yield:</span>
                                          <span className="text-green-600">{formatCurrency(dailyEarning)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">APY:</span>
                                          <span>{formatPercentage(investment.apy)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-muted/50 p-4 rounded-md">
                                      <h4 className="font-medium mb-2">Risk Assessment</h4>
                                      <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-sm text-muted-foreground">Risk Score:</span>
                                          <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(investment.riskScore)}`}>
                                            {investment.riskScore}/100
                                          </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                          <div 
                                            className={`h-2.5 rounded-full ${investment.riskScore < 30 ? 'bg-green-600' : investment.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                            style={{ width: `${investment.riskScore}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-sm mt-3">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Volatility:</span>
                                          <span>{typeof investment.volatility === 'number' ? investment.volatility.toFixed(1) : '0.0'}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Protocol Risk:</span>
                                          <span>{investment.protocol.toLowerCase().includes('uniswap') || investment.protocol.toLowerCase().includes('curve') ? 'Low' : investment.protocol.toLowerCase().includes('sushi') ? 'Medium' : 'High'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Right column - Profit breakdown */}
                                  <div className="space-y-4">
                                    <div className="bg-muted/50 p-4 rounded-md">
                                      <h4 className="font-medium mb-2">Profit Breakdown</h4>
                                      
                                      {/* Trading Fees */}
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Trading Fees:</span>
                                          <span className="text-green-600">{formatCurrency(safeTradingFees(investment))}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                                          <div 
                                            className="h-1.5 rounded-full bg-blue-600"
                                            style={{ width: `${(safeTradingFees(investment) / investment.totalEarnings) * 100}%` }}
                                          ></div>
                                        </div>
                                        
                                        {/* Reward Tokens */}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Reward Tokens:</span>
                                          <span className="text-green-600">{formatCurrency(totalRewardValue)}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                                          <div 
                                            className="h-1.5 rounded-full bg-purple-600"
                                            style={{ width: `${(totalRewardValue / investment.totalEarnings) * 100}%` }}
                                          ></div>
                                        </div>
                                        
                                        {/* Impermanent Loss */}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Impermanent Loss:</span>
                                          <span className="text-red-600">-{formatCurrency(safeImpermanentLoss(investment))}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                                          <div 
                                            className="h-1.5 rounded-full bg-red-600"
                                            style={{ width: `${(safeImpermanentLoss(investment) / investment.totalEarnings) * 100}%` }}
                                          ></div>
                                        </div>
                                        
                                        <div className="border-t border-border pt-2 mt-2 flex justify-between font-medium">
                                          <span>Net Profit:</span>
                                          <span className="text-green-600">
                                            {formatCurrency(investment.totalEarnings - safeImpermanentLoss(investment))}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Reward Token Details */}
                                    <div className="bg-muted/50 p-4 rounded-md">
                                      <h4 className="font-medium mb-2">Reward Token Details</h4>
                                      {safeRewardTokens(investment).length > 0 ? (
                                        <div className="space-y-3">
                                          {safeRewardTokens(investment).map((token, index) => (
                                            <div key={index} className="text-sm">
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium">{token.symbol}</span>
                                                <span className="text-green-600">{formatCurrency(token.value)}</span>
                                              </div>
                                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>Amount: {typeof token.amount === 'number' ? token.amount.toFixed(4) : '0.0000'}</span>
                                                <span>APR: {typeof token.apr === 'number' ? token.apr.toFixed(2) : '0.00'}%</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No reward tokens for this position</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeInvestment(investment.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-md">
              <p className="text-muted-foreground mb-4">You haven't added any investments yet</p>
              <Button onClick={() => setIsAddingInvestment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Investment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Investment Dialog */}
      <Dialog open={isAddingInvestment} onOpenChange={setIsAddingInvestment}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Investment</DialogTitle>
            <DialogDescription>
              Enter the details of your yield farming investment to track its performance
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pool-name" className="text-right">
                Pool Name
              </Label>
              <Input
                id="pool-name"
                value={newInvestment.poolName}
                onChange={(e) => setNewInvestment({ ...newInvestment, poolName: e.target.value })}
                className="col-span-3"
                placeholder="e.g., USDC-ETH"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="protocol" className="text-right">
                Protocol
              </Label>
              <Input
                id="protocol"
                value={newInvestment.protocol}
                onChange={(e) => setNewInvestment({ ...newInvestment, protocol: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Uniswap"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount ($)
              </Label>
              <Input
                id="amount"
                type="number"
                value={newInvestment.amount}
                onChange={(e) => setNewInvestment({ ...newInvestment, amount: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apy" className="text-right">
                APY (%)
              </Label>
              <Input
                id="apy"
                type="number"
                value={newInvestment.apy}
                onChange={(e) => setNewInvestment({ ...newInvestment, apy: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={newInvestment.startDate}
                onChange={(e) => setNewInvestment({ ...newInvestment, startDate: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingInvestment(false)}>
              Cancel
            </Button>
            <Button onClick={addInvestment}>Add Investment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portfolio Health Dashboard Dialog */}
      <Dialog open={showHealthDashboard} onOpenChange={setShowHealthDashboard}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Portfolio Health Dashboard</DialogTitle>
            <DialogDescription>
              Comprehensive analysis of your portfolio's health, risk, and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Overall Health Score */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-sm text-muted-foreground">Overall Portfolio Health</div>
              <div className="relative h-36 w-36">
                <div 
                  className="absolute inset-0 rounded-full border-8 border-muted"
                  style={{ borderRadius: '50%' }}
                ></div>
                <div 
                  className="absolute inset-0 rounded-full border-8 transition-all duration-1000 ease-in-out"
                  style={{
                    borderRadius: '50%',
                    borderColor: `${portfolioHealth.overallHealthScore > 70 ? 'rgb(34, 197, 94)' : 
                                  portfolioHealth.overallHealthScore > 40 ? 'rgb(234, 179, 8)' : 
                                  'rgb(239, 68, 68)'}`,
                    clipPath: `polygon(50% 50%, 50% 0%, ${portfolioHealth.overallHealthScore > 0 ? '100%' : '50%'} 0%)`,
                    transform: `rotate(${portfolioHealth.overallHealthScore * 3.6}deg)`,
                    transformOrigin: 'center',
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-bold">{portfolioHealth.overallHealthScore}</div>
                </div>
              </div>
              <div className="text-sm font-medium mt-2">
                {portfolioHealth.overallHealthScore > 70 ? 'Excellent' : 
                 portfolioHealth.overallHealthScore > 50 ? 'Good' : 
                 portfolioHealth.overallHealthScore > 30 ? 'Fair' : 'Needs Attention'}
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/20 p-4 rounded-md flex flex-col items-center">
                <div className="text-sm text-muted-foreground mb-1">Diversification</div>
                <div 
                  className={`text-2xl font-bold ${portfolioHealth.diversificationScore > 70 ? 'text-green-500' : 
                                                  portfolioHealth.diversificationScore > 40 ? 'text-yellow-500' : 
                                                  'text-red-500'}`}
                >
                  {portfolioHealth.diversificationScore}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${portfolioHealth.diversificationScore > 70 ? 'bg-green-500' : 
                                                    portfolioHealth.diversificationScore > 40 ? 'bg-yellow-500' : 
                                                    'bg-red-500'}`} 
                    style={{ width: `${portfolioHealth.diversificationScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-muted/20 p-4 rounded-md flex flex-col items-center">
                <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                <div 
                  className={`text-2xl font-bold ${portfolioHealth.riskScore < 30 ? 'text-green-500' : 
                                                  portfolioHealth.riskScore < 60 ? 'text-yellow-500' : 
                                                  'text-red-500'}`}
                >
                  {portfolioHealth.riskScore}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${portfolioHealth.riskScore < 30 ? 'bg-green-500' : 
                                                    portfolioHealth.riskScore < 60 ? 'bg-yellow-500' : 
                                                    'bg-red-500'}`} 
                    style={{ width: `${portfolioHealth.riskScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-muted/20 p-4 rounded-md flex flex-col items-center">
                <div className="text-sm text-muted-foreground mb-1">Performance</div>
                <div 
                  className={`text-2xl font-bold ${portfolioHealth.performanceScore > 70 ? 'text-green-500' : 
                                                  portfolioHealth.performanceScore > 40 ? 'text-yellow-500' : 
                                                  'text-red-500'}`}
                >
                  {portfolioHealth.performanceScore}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${portfolioHealth.performanceScore > 70 ? 'bg-green-500' : 
                                                    portfolioHealth.performanceScore > 40 ? 'bg-yellow-500' : 
                                                    'bg-red-500'}`} 
                    style={{ width: `${portfolioHealth.performanceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Portfolio Insights */}
            <div className="bg-muted/20 p-4 rounded-md space-y-3">
              <h3 className="font-medium">Portfolio Insights</h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {portfolioHealth.topPerformer && (
                  <>
                    <div className="text-muted-foreground">Top Performer:</div>
                    <div className="font-medium text-green-600">{portfolioHealth.topPerformer}</div>
                  </>
                )}
                
                {portfolioHealth.underperformer && (
                  <>
                    <div className="text-muted-foreground">Underperformer:</div>
                    <div className="font-medium text-red-500">{portfolioHealth.underperformer}</div>
                  </>
                )}
                
                {portfolioHealth.riskConcentration && (
                  <>
                    <div className="text-muted-foreground">Highest Concentration:</div>
                    <div className="font-medium">{portfolioHealth.riskConcentration}</div>
                  </>
                )}
                
                <div className="text-muted-foreground">Total ROI:</div>
                <div className="font-medium">{formatPercentage(calculateRoi())}</div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Recommendations</h3>
              <ul className="space-y-2">
                {portfolioHealth.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                    <div className="mr-2 mt-0.5">•</div>
                    <div>{rec}</div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Historical Health Tracking - Placeholder for future implementation */}
            <div className="bg-muted/10 p-4 rounded-md border border-dashed border-muted">
              <h3 className="font-medium text-muted-foreground mb-2">Health History</h3>
              <p className="text-sm text-muted-foreground">Portfolio health tracking over time will be available soon. This feature will allow you to monitor how your portfolio health metrics change as you adjust your investments.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowHealthDashboard(false)}>
              Close Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulation Dialog */}
      <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {simulationComplete ? 'Simulation Results' : 'Simulate Future Earnings'}
            </DialogTitle>
            <DialogDescription>
              {simulationComplete 
                ? `${simulationDays}-day projection based on current APY rates` 
                : 'See how your investments would grow over time based on current APY rates'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {isSimulating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Simulating day-by-day growth...</span>
                  <span className="font-medium">{simulationProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
                
                {simulationHistory.length > 1 && (
                  <div className="h-60 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={simulationHistory}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickMargin={5}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                          width={80}
                          // Calculate domain based on min/max values with padding to show growth
                          domain={[
                            (dataMin: number) => {
                              // Set minimum to slightly below the lowest value to show growth
                              return Math.floor(dataMin * 0.995);
                            },
                            (dataMax: number) => {
                              // Set maximum to slightly above the highest value
                              return Math.ceil(dataMax * 1.005);
                            }
                          ]}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          itemStyle={{ color: '#8884d8' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#4ade80" // Changed to green to better represent growth
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 5 }}
                          name="Portfolio Value"
                          isAnimationActive={true}
                          animationDuration={300}
                        />
                        {/* Add a reference line to show starting value */}
                        {simulationHistory.length > 0 && (
                          <ReferenceLine 
                            y={simulationHistory[0].value} 
                            stroke="#888" 
                            strokeDasharray="3 3" 
                            label={{
                              value: 'Initial Value',
                              position: 'insideBottomLeft',
                              fill: '#888',
                              fontSize: 10
                            }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : simulationComplete && simulationSummary ? (
              <div className="space-y-4">
                {/* Simulation Results Chart */}
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={simulationHistory}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickMargin={5}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        width={80}
                        domain={[
                          (dataMin: number) => Math.floor(dataMin * 0.995),
                          (dataMax: number) => Math.ceil(dataMax * 1.005)
                        ]}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        itemStyle={{ color: '#4ade80' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#4ade80"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                        name="Portfolio Value"
                      />
                      <ReferenceLine 
                        y={simulationHistory[0].value} 
                        stroke="#888" 
                        strokeDasharray="3 3" 
                        label={{
                          value: 'Initial Value',
                          position: 'insideBottomLeft',
                          fill: '#888',
                          fontSize: 10
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Simulation Summary */}
                <div className="bg-muted/20 rounded-md p-4 space-y-4">
                  <h3 className="font-medium text-lg">Simulation Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Initial Investment</div>
                        <div className="text-xl font-medium">{formatCurrency(simulationSummary.initialValue)}</div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Final Value</div>
                        <div className="text-xl font-medium text-green-500">{formatCurrency(simulationSummary.finalValue)}</div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Total Growth</div>
                        <div className="text-xl font-medium text-green-500">
                          +{formatCurrency(simulationSummary.totalGrowth)}
                          <span className="text-sm ml-1">({simulationSummary.percentageGrowth.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Timeframe</div>
                        <div className="text-xl font-medium">{simulationDays} days</div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Daily Average Earnings</div>
                        <div className="text-xl font-medium text-green-500">{formatCurrency(simulationSummary.dailyAverage)}</div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Projected Annual Return</div>
                        <div className="text-xl font-medium text-green-500">{simulationSummary.projectedAnnualReturn.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-md text-green-800 dark:text-green-300 text-sm">
                    <p className="font-medium">Projection Insights:</p>
                    <p className="mt-1">
                      At this growth rate, your investment would {simulationSummary.projectedAnnualReturn > 100 ? 'more than double' : 'grow significantly'} in a year. 
                      The power of compound interest means your daily earnings will continue to increase over time.
                    </p>
                    <p className="mt-2 font-medium">What happens if you apply this simulation?</p>
                    <p className="mt-1">
                      <strong>Applying this simulation will fast-forward your portfolio by {simulationDays} days</strong>, adding approximately 
                      <strong>${(simulationSummary.finalValue - simulationSummary.initialValue).toFixed(2)}</strong> to your current portfolio value.
                      This is useful for testing different investment strategies or seeing future portfolio states.
                    </p>
                    <p className="mt-1 text-amber-600 dark:text-amber-400">
                      <strong>Note:</strong> When applied, you'll see the changes highlighted in your portfolio summary cards.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="simulation-days" className="text-right">
                    Days to Simulate
                  </Label>
                  <Input
                    id="simulation-days"
                    type="number"
                    value={simulationDays}
                    onChange={(e) => setSimulationDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                    className="col-span-3"
                    min="1"
                    max="365"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Simulation Speed
                  </Label>
                  <div className="col-span-3">
                    <div className="flex space-x-2">
                      <Button 
                        variant={simulationSpeed === 'slow' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSimulationSpeed('slow')}
                        className="flex-1"
                      >
                        Slow
                      </Button>
                      <Button 
                        variant={simulationSpeed === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSimulationSpeed('medium')}
                        className="flex-1"
                      >
                        Medium
                      </Button>
                      <Button 
                        variant={simulationSpeed === 'fast' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSimulationSpeed('fast')}
                        className="flex-1"
                      >
                        Fast
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md space-y-2">
                  <h4 className="font-medium">Simulation Preview:</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-sm text-muted-foreground">Current Portfolio Value:</div>
                    <div className="text-sm font-medium">{formatCurrency(portfolio.totalCurrentValue)}</div>
                    
                    <div className="text-sm text-muted-foreground">Estimated Future Value:</div>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(portfolio.investments.reduce((total, inv) => {
                        const dailyRate = inv.apy / 365 / 100;
                        return total + (inv.currentValue * Math.pow(1 + dailyRate, simulationDays));
                      }, 0))}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">Estimated Earnings:</div>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(portfolio.investments.reduce((total, inv) => {
                        const dailyRate = inv.apy / 365 / 100;
                        return total + (inv.currentValue * Math.pow(1 + dailyRate, simulationDays) - inv.currentValue);
                      }, 0))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {isSimulating ? (
              <Button variant="outline" onClick={() => setIsSimulating(false)}>
                Cancel Simulation
              </Button>
            ) : simulationComplete ? (
              <>
                <Button variant="outline" onClick={() => {
                  setSimulationComplete(false);
                  setSimulationSummary(null);
                }}>
                  Run New Simulation
                </Button>
                <Button 
                  onClick={applySimulationToPortfolio}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Apply to Portfolio
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  simulateDailyUpdate(simulationDays);
                  setShowSimulationDialog(false);
                }}>
                  Quick Simulate
                </Button>
                <Button 
                  onClick={() => {
                    // Reset simulation history and state before starting
                    setSimulationHistory([]);
                    setSimulationComplete(false);
                    setSimulationSummary(null);
                    setSimulatedPortfolioResult(null);
                    setTimeout(() => simulateDailyUpdate(simulationDays, true), 100);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Visual Simulation
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
