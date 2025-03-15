import { NextResponse } from 'next/server';

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

// Cache the results to avoid hitting rate limits
let poolsCache: DefiLlamaPool[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'polygon';
    const minTvl = Number(searchParams.get('minTvl')) || 10000;
    
    // Check if we have a valid cache
    const now = Date.now();
    if (poolsCache && now - lastFetchTime < CACHE_DURATION) {
      console.log('[DeFi Llama API] Using cached data');
      
      // Filter pools based on query parameters
      const filteredPools = poolsCache.filter(pool => 
        pool.chain.toLowerCase() === chain.toLowerCase() && 
        pool.tvlUsd >= minTvl
      );
      
      return NextResponse.json(filteredPools);
    }
    
    // Fetch fresh data from DeFi Llama
    console.log('[DeFi Llama API] Fetching fresh data');
    const response = await fetch('https://yields.llama.fi/pools');
    
    if (!response.ok) {
      throw new Error(`DeFi Llama API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    poolsCache = data.data;
    lastFetchTime = now;
    
    // Filter pools based on query parameters
    const filteredPools = poolsCache ? poolsCache.filter(pool => 
      pool.chain.toLowerCase() === chain.toLowerCase() && 
      pool.tvlUsd >= minTvl
    ) : [];
    
    return NextResponse.json(filteredPools);
  } catch (error) {
    console.error('[DeFi Llama API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from DeFi Llama' }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS preflight
export function OPTIONS() {
  return NextResponse.json({}, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    } 
  });
}
