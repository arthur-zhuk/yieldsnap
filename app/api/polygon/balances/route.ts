import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { polygon } from 'wagmi/chains';
import { POLYGON_TOKENS } from '@/lib/services/yieldService';

// Create a public client for Polygon with a server-side API key
// In production, use environment variables for API keys
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'demo';
const publicClient = createPublicClient({
  chain: polygon,
  transport: http(`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
});

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  }
];

// Function to fetch user balances
async function fetchUserBalances(address: string) {
  try {
    const balances: Record<string, number> = {};
    
    // If using demo API key, return mock data to avoid rate limiting
    if (ALCHEMY_API_KEY === 'demo') {
      return {
        USDC: 1000.0,
        DAI: 1000.0,
        WETH: 0.5
      };
    }
    
    for (const [symbol, tokenAddress] of Object.entries(POLYGON_TOKENS)) {
      try {
        // Get token decimals
        const decimals = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals',
        });
        
        // Get user balance
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        
        // Convert to human-readable format
        balances[symbol] = Number(formatUnits(balance as bigint, Number(decimals)));
      } catch (error) {
        console.error(`Error fetching balance for ${symbol}:`, error);
        balances[symbol] = 0;
      }
    }
    
    return balances;
  } catch (error) {
    console.error('Error fetching user balances:', error);
    return {};
  }
}

export async function GET(request: Request) {
  try {
    // Get the wallet address from the query string
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Fetching balances for address: ${address}`);
    
    // Fetch user balances
    const balances = await fetchUserBalances(address);
    console.log(`[API] Successfully fetched balances for ${Object.keys(balances).length} tokens`);
    
    return NextResponse.json(balances);
  } catch (error) {
    console.error('[API] Error in balances API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
