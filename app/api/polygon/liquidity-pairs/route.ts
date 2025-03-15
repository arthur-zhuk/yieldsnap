import { NextResponse } from 'next/server';
import { formatUnits } from 'viem';

// Define the structure for liquidity pair data
export interface LiquidityPair {
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
  fee: number; // Fee percentage
  volume24h: number;
  volumeChange7d: number; // Percentage change in volume over 7 days
}

// Mock data for liquidity pairs
const mockLiquidityPairs: LiquidityPair[] = [
  {
    pairAddress: '0x45dda9cb7c25131df268515131f647d726f50608',
    token0: {
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      price: 1.0
    },
    token1: {
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      price: 3500.0
    },
    protocol: 'QuickSwap',
    tvl: 4500000,
    apr: 12.5,
    rewardTokens: [
      {
        symbol: 'QUICK',
        address: '0xb5c064f955d8e7f38fe0460c556a72987494ee17',
        rewardRate: 0.00025,
        price: 45.0
      }
    ],
    riskLevel: 'low',
    farmUrl: 'https://quickswap.exchange/#/pools/v2/0x45dda9cb7c25131df268515131f647d726f50608',
    swapUrl: 'https://quickswap.exchange/#/swap',
    fee: 0.3,
    volume24h: 1200000,
    volumeChange7d: 5.2
  },
  {
    pairAddress: '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
    token0: {
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      price: 1.0
    },
    token1: {
      address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      price: 65000.0
    },
    protocol: 'SushiSwap',
    tvl: 3800000,
    apr: 9.8,
    rewardTokens: [
      {
        symbol: 'SUSHI',
        address: '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
        rewardRate: 0.00018,
        price: 1.2
      }
    ],
    riskLevel: 'low',
    farmUrl: 'https://app.sushi.com/pool/137:0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
    swapUrl: 'https://app.sushi.com/swap',
    fee: 0.25,
    volume24h: 950000,
    volumeChange7d: 3.8
  },
  {
    pairAddress: '0x160532d2536175d65c03b97b0630a9802c274dad',
    token0: {
      address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      price: 1.0
    },
    token1: {
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      price: 1.0
    },
    protocol: 'Curve',
    tvl: 8200000,
    apr: 4.2,
    rewardTokens: [
      {
        symbol: 'CRV',
        address: '0x172370d5cd63279efa6d502dab29171933a610af',
        rewardRate: 0.00042,
        price: 0.8
      }
    ],
    riskLevel: 'low',
    farmUrl: 'https://polygon.curve.fi/factory-crypto/0x160532d2536175d65c03b97b0630a9802c274dad',
    swapUrl: 'https://polygon.curve.fi/swap',
    fee: 0.04,
    volume24h: 3500000,
    volumeChange7d: 1.5
  },
  {
    pairAddress: '0xcd578f016888b57f1b1e3f887f392f0159e26747',
    token0: {
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      price: 0.85
    },
    token1: {
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      price: 3500.0
    },
    protocol: 'UniswapV3',
    tvl: 2800000,
    apr: 18.5,
    rewardTokens: [
      {
        symbol: 'UNI',
        address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f',
        rewardRate: 0.00032,
        price: 10.5
      }
    ],
    riskLevel: 'medium',
    farmUrl: 'https://app.uniswap.org/#/pools/137/0xcd578f016888b57f1b1e3f887f392f0159e26747',
    swapUrl: 'https://app.uniswap.org/#/swap',
    fee: 0.3,
    volume24h: 1800000,
    volumeChange7d: 8.7
  },
  {
    pairAddress: '0x9b17baadf0f21f03e35249e0e59723f34994f806',
    token0: {
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      price: 0.85
    },
    token1: {
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      price: 1.0
    },
    protocol: 'Balancer',
    tvl: 1500000,
    apr: 15.2,
    rewardTokens: [
      {
        symbol: 'BAL',
        address: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
        rewardRate: 0.00028,
        price: 6.2
      }
    ],
    riskLevel: 'medium',
    farmUrl: 'https://app.balancer.fi/#/polygon/pool/0x9b17baadf0f21f03e35249e0e59723f34994f806/add',
    swapUrl: 'https://app.balancer.fi/#/polygon/swap',
    fee: 0.2,
    volume24h: 750000,
    volumeChange7d: 4.3
  }
];

// Helper function to calculate comprehensive risk and quality score for liquidity pairs
function calculateRiskScore(pair: LiquidityPair): number {
  // Factors that contribute to risk and quality assessment:
  // 1. Price volatility between the tokens
  // 2. Protocol reputation, security, and audit status
  // 3. TVL (higher is generally safer)
  // 4. Volume (higher is generally better)
  // 5. Volume stability (less volatility is better)
  // 6. Historical APR stability
  // 7. Smart contract age and security
  
  let riskScore = 0;
  
  // === TOKEN PAIR RISK ASSESSMENT ===
  // Stablecoin pairs are lowest risk
  const stablecoins = ['USDC', 'DAI', 'USDT', 'BUSD', 'USDP', 'TUSD', 'FRAX', 'LUSD'];
  const isStablePair = 
    stablecoins.includes(pair.token0.symbol) && stablecoins.includes(pair.token1.symbol);
  
  // Blue-chip tokens with established history
  const blueChipTokens = ['WETH', 'WBTC', 'WMATIC', 'LINK', 'AAVE', 'UNI', 'MKR'];
  const isBlueChipPair = 
    (blueChipTokens.includes(pair.token0.symbol) || stablecoins.includes(pair.token0.symbol)) &&
    (blueChipTokens.includes(pair.token1.symbol) || stablecoins.includes(pair.token1.symbol));
  
  if (isStablePair) {
    riskScore += 1; // Lowest risk
  } else if (isBlueChipPair) {
    riskScore += 2; // Low-medium risk
  } else if (blueChipTokens.includes(pair.token0.symbol) || blueChipTokens.includes(pair.token1.symbol)) {
    riskScore += 3; // Medium risk - one blue chip token
  } else {
    riskScore += 4; // Higher risk - no established tokens
  }
  
  // === PROTOCOL RISK ASSESSMENT ===
  // Categorize protocols by security, longevity, and audit status
  const topTierProtocols = ['Curve', 'Aave', 'Compound', 'Uniswap'];
  const midTierProtocols = ['SushiSwap', 'QuickSwap', 'Balancer', 'Bancor'];
  const lowerTierProtocols = ['PancakeSwap', 'TraderJoe'];
  
  if (topTierProtocols.includes(pair.protocol)) {
    riskScore += 1; // Top tier protocols - lowest risk
  } else if (midTierProtocols.includes(pair.protocol)) {
    riskScore += 2; // Mid tier protocols - medium risk
  } else if (lowerTierProtocols.includes(pair.protocol)) {
    riskScore += 3; // Lower tier but still established
  } else {
    riskScore += 4; // Unknown or newer protocols - higher risk
  }
  
  // === LIQUIDITY AND MARKET METRICS ===
  // TVL risk factor - higher TVL means deeper liquidity and typically lower risk
  if (pair.tvl > 10000000) {
    riskScore += 1; // Very high TVL - lowest risk
  } else if (pair.tvl > 5000000) {
    riskScore += 2; // High TVL - low risk
  } else if (pair.tvl > 1000000) {
    riskScore += 3; // Medium TVL - medium risk
  } else {
    riskScore += 4; // Low TVL - higher risk
  }
  
  // Volume risk factor - higher volume means more active trading and typically lower risk
  if (pair.volume24h > 5000000) {
    riskScore += 1; // Very high volume
  } else if (pair.volume24h > 2000000) {
    riskScore += 2; // High volume
  } else if (pair.volume24h > 500000) {
    riskScore += 3; // Medium volume
  } else {
    riskScore += 4; // Low volume - higher risk
  }
  
  // Volume stability - less volatility is better
  // Using 7-day volume change as a proxy for stability
  if (Math.abs(pair.volumeChange7d) < 5) {
    riskScore += 1; // Very stable volume
  } else if (Math.abs(pair.volumeChange7d) < 15) {
    riskScore += 2; // Moderately stable volume
  } else if (Math.abs(pair.volumeChange7d) < 30) {
    riskScore += 3; // Somewhat volatile volume
  } else {
    riskScore += 4; // Highly volatile volume
  }
  
  // Calculate final risk score (6-24 range)
  // Lower score = lower risk = better quality
  return riskScore;
}

// Calculate potential profit for a given investment amount and time period
function calculatePotentialProfit(pair: LiquidityPair, investmentAmount: number, days: number): {
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
} {
  // Calculate fees earned from trading volume
  const poolShare = investmentAmount / (pair.tvl + investmentAmount);
  const dailyFees = (pair.volume24h * pair.fee / 100) * poolShare;
  const feesEarned = dailyFees * days;
  
  // Calculate rewards earned from farming incentives with detailed breakdown
  let rewardsEarned = 0;
  const rewardTokenBreakdown: { symbol: string; amount: number; value: number }[] = [];
  
  pair.rewardTokens.forEach(token => {
    const dailyRewards = token.rewardRate * investmentAmount;
    const tokenAmount = dailyRewards * days;
    const tokenValue = tokenAmount * token.price;
    
    rewardsEarned += tokenValue;
    rewardTokenBreakdown.push({
      symbol: token.symbol,
      amount: tokenAmount,
      value: tokenValue
    });
  });
  
  // Calculate impermanent loss
  // Simplified IL calculation based on price change expectations
  // We'll use historical volatility as a proxy for expected price movement
  const expectedPriceRatio = 1 + (pair.volumeChange7d / 100);
  
  // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  const impermanentLoss = investmentAmount * (
    2 * Math.sqrt(expectedPriceRatio) / (1 + expectedPriceRatio) - 1
  ) * -1; // Make positive for easier understanding
  
  const totalProfit = feesEarned + rewardsEarned;
  const netProfit = totalProfit - impermanentLoss;
  const roi = (netProfit / investmentAmount) * 100;
  const apy = (Math.pow(1 + (roi / 100), 365 / days) - 1) * 100;
  
  // Calculate risk score (lower is better)
  const riskScore = calculateRiskScore(pair);
  
  // Calculate risk-adjusted return (Sharpe-like ratio)
  // Higher number is better - represents return per unit of risk
  const riskAdjustedReturn = apy / (riskScore * 2); // Scaling factor to make it more intuitive
  
  // Calculate overall quality score (0-100 scale, higher is better)
  // Combines risk assessment and return potential
  const maxRiskScore = 24; // Maximum possible risk score
  const riskComponent = ((maxRiskScore - riskScore) / maxRiskScore) * 60; // 60% weight to risk
  const returnComponent = Math.min(apy / 50, 1) * 40; // 40% weight to return, capped at 50% APY
  const qualityScore = riskComponent + returnComponent;
  
  return {
    feesEarned,
    rewardsEarned,
    totalProfit,
    impermanentLoss,
    netProfit,
    roi,
    apy,
    riskAdjustedReturn,
    qualityScore,
    rewardTokenBreakdown
  };
}

export async function GET(request: Request) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get('riskLevel');
    const minTvl = searchParams.get('minTvl') ? parseFloat(searchParams.get('minTvl')!) : 0;
    const minApr = searchParams.get('minApr') ? parseFloat(searchParams.get('minApr')!) : 0;
    const investmentAmount = searchParams.get('investmentAmount') ? parseFloat(searchParams.get('investmentAmount')!) : 1000;
    const timeHorizon = searchParams.get('timeHorizon') ? parseInt(searchParams.get('timeHorizon')!) : 30;
    const sortBy = searchParams.get('sortBy') || 'qualityScore'; // Default to quality score
    const showHealthyOnly = searchParams.get('showHealthyOnly') === 'true'; // New parameter
    const minQualityScore = searchParams.get('minQualityScore') ? parseFloat(searchParams.get('minQualityScore')!) : 0;

    // Filter pairs based on query parameters
    let filteredPairs = [...mockLiquidityPairs];
    
    if (riskLevel) {
      filteredPairs = filteredPairs.filter(pair => pair.riskLevel === riskLevel);
    }
    
    if (minTvl > 0) {
      filteredPairs = filteredPairs.filter(pair => pair.tvl >= minTvl);
    }
    
    if (minApr > 0) {
      filteredPairs = filteredPairs.filter(pair => pair.apr >= minApr);
    }
    
    // Calculate profit projections and risk metrics for each pair
    const pairsWithMetrics = filteredPairs.map(pair => {
      const profitProjection = calculatePotentialProfit(pair, investmentAmount, timeHorizon);
      const riskScore = calculateRiskScore(pair);
      
      // Determine risk level based on risk score
      let calculatedRiskLevel: 'low' | 'medium' | 'high';
      if (riskScore <= 10) {
        calculatedRiskLevel = 'low';
      } else if (riskScore <= 16) {
        calculatedRiskLevel = 'medium';
      } else {
        calculatedRiskLevel = 'high';
      }
      
      return {
        ...pair,
        profitProjection,
        riskScore,
        riskLevel: calculatedRiskLevel // Override the risk level with calculated value
      };
    });
    
    // Apply healthy-only filter if requested
    let resultPairs = pairsWithMetrics;
    if (showHealthyOnly) {
      resultPairs = resultPairs.filter(pair => 
        pair.riskLevel === 'low' && 
        pair.profitProjection.qualityScore >= 70 && // Only high quality pairs
        pair.tvl >= 1000000 && // Minimum TVL for safety
        pair.volume24h >= 500000 // Minimum volume for liquidity
      );
    }
    
    // Apply minimum quality score filter if specified
    if (minQualityScore > 0) {
      resultPairs = resultPairs.filter(pair => 
        pair.profitProjection.qualityScore >= minQualityScore
      );
    }
    
    // Sort based on selected criteria
    switch (sortBy) {
      case 'apr':
        resultPairs.sort((a, b) => b.apr - a.apr);
        break;
      case 'tvl':
        resultPairs.sort((a, b) => b.tvl - a.tvl);
        break;
      case 'volume':
        resultPairs.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'profit':
        resultPairs.sort((a, b) => (b.profitProjection?.totalProfit || 0) - (a.profitProjection?.totalProfit || 0));
        break;
      case 'risk':
        resultPairs.sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0)); // Lower risk first
        break;
      case 'riskAdjustedReturn':
        resultPairs.sort((a, b) => (b.profitProjection?.riskAdjustedReturn || 0) - (a.profitProjection?.riskAdjustedReturn || 0));
        break;
      case 'qualityScore':
      default:
        resultPairs.sort((a, b) => (b.profitProjection?.qualityScore || 0) - (a.profitProjection?.qualityScore || 0)); // Higher quality first
        break;
    }

    return NextResponse.json({ 
      pairs: resultPairs,
      timestamp: new Date().toISOString()
    }, { status: 200, headers });
  } catch (error) {
    console.error('Error fetching liquidity pairs:', error);
    return NextResponse.json({ error: 'Failed to fetch liquidity pairs' }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
