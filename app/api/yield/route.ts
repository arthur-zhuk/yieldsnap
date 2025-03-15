import { NextResponse } from 'next/server';
import { YieldOpportunity } from '@/components/yield-scanner/YieldTable';

// Mock data for development
const mockYieldData: YieldOpportunity[] = [
  {
    protocol: 'Aave',
    asset: 'USDC',
    symbol: 'USDC',
    apr: 5.2,
    tvl: 500000000,
    userBalance: 100,
    depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&marketName=proto_polygon_v3',
  },
  {
    protocol: 'Compound',
    asset: 'USDC',
    symbol: 'USDC',
    apr: 4.8,
    tvl: 300000000,
    userBalance: 100,
    depositUrl: 'https://app.compound.finance/',
  },
  {
    protocol: 'Aave',
    asset: 'DAI',
    symbol: 'DAI',
    apr: 4.5,
    tvl: 200000000,
    userBalance: 50,
    depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&marketName=proto_polygon_v3',
  },
  {
    protocol: 'Compound',
    asset: 'DAI',
    symbol: 'DAI',
    apr: 4.2,
    tvl: 150000000,
    userBalance: 50,
    depositUrl: 'https://app.compound.finance/',
  },
  {
    protocol: 'Aave',
    asset: 'WETH',
    symbol: 'WETH',
    apr: 2.1,
    tvl: 800000000,
    userBalance: 0.5,
    depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&marketName=proto_polygon_v3',
  },
  {
    protocol: 'Compound',
    asset: 'WETH',
    symbol: 'WETH',
    apr: 1.9,
    tvl: 600000000,
    userBalance: 0.5,
    depositUrl: 'https://app.compound.finance/',
  },
];

export async function GET(request: Request) {
  // Get the wallet address from the query string
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  // If no address is provided, return opportunities with zero balance
  if (!address) {
    const zeroBalanceData = mockYieldData.map(opportunity => ({
      ...opportunity,
      userBalance: 0,
    }));
    
    return NextResponse.json(zeroBalanceData);
  }
  
  // In a real implementation, we would fetch user balances and update the opportunities
  // For now, we'll just return the mock data
  return NextResponse.json(mockYieldData);
} 