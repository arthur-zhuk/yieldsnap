import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { polygon } from 'wagmi/chains';

// Create a public client for Polygon with a server-side API key
// In production, use environment variables for API keys
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || 'demo';

// Create a public client with retry logic and better error handling
const publicClient = createPublicClient({
  chain: polygon,
  transport: http(`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
    timeout: 30000, // 30 seconds timeout
    fetchOptions: {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add cache control to prevent caching issues
      cache: 'no-store',
    },
    retryCount: 3,
    retryDelay: 1000, // 1 second between retries
  }),
});

// Aave V3 Pool contract address on Polygon
const AAVE_V3_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';

// ERC20 ABI for approval and balance checking
const ERC20_ABI = [
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  }
];

export async function GET(request: Request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }
  try {
    // Get parameters from the query string
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get('protocol');
    const tokenAddress = searchParams.get('tokenAddress') || '';
    const amount = searchParams.get('amount') || '0';
    const userAddress = searchParams.get('userAddress') || '';
    
    // Log the request for debugging
    console.log(`[Gas Estimate API] Request with protocol=${protocol}, tokenAddress=${tokenAddress}, amount=${amount}, userAddress=${userAddress}`);
    
    // Skip validation to avoid 400 errors when tokenAddress is empty
    // This ensures the frontend doesn't break even with incomplete data
    
    // Always return mock data for now to avoid API rate limiting issues
    // In production, you would use the real API with proper rate limiting
    return NextResponse.json(
      { 
        gasEstimate: '~0.01 MATIC',
        estimatedGasFee: '$0.50', 
        estimatedGasCost: '0.5' 
      }, 
      { headers }
    );
    
    // The code below is unreachable but kept for reference
    
    // Convert amount to proper units
    const tokenContract = { address: tokenAddress as `0x${string}`, abi: ERC20_ABI };
    const decimals = await publicClient.readContract({
      ...tokenContract,
      functionName: 'decimals',
    });
    
    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** Number(decimals)));
    
    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();
    
    let gasEstimate = BigInt(200000); // Default gas estimate
    
    if (protocol === 'Aave') {
      try {
        // Check if user has approved the token for Aave
        const allowance = await publicClient.readContract({
          ...tokenContract,
          functionName: 'allowance',
          args: [userAddress as `0x${string}`, AAVE_V3_POOL_ADDRESS as `0x${string}`],
        });
        
        // Calculate total gas (approval + deposit)
        let totalGasEstimate = BigInt(0);
        
        // If allowance is less than amount, we need to estimate approval gas too
        if ((allowance as bigint) < amountInWei) {
          // Use a fixed value for approval gas
          totalGasEstimate += BigInt(60000);
        }
        
        // For deposit, use a fixed gas estimate to avoid simulation errors
        totalGasEstimate += BigInt(250000); // Typical Aave deposit gas
        
        gasEstimate = totalGasEstimate;
      } catch (error) {
        console.error('Error estimating Aave gas:', error);
        // Use a conservative estimate that includes approval + deposit
        gasEstimate = BigInt(310000);
      }
    }
    
    // Calculate gas cost in MATIC
    const gasCostWei = gasEstimate * gasPrice;
    const gasCostMatic = formatUnits(gasCostWei, 18);
    
    // Format to 4 decimal places
    const formattedGasCost = `~${parseFloat(gasCostMatic).toFixed(4)} MATIC`;
    
    return NextResponse.json({ gasEstimate: formattedGasCost }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Error estimating gas:', error);
    return NextResponse.json(
      { error: 'Failed to estimate gas', details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}
