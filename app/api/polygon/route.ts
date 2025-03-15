import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { polygon } from 'wagmi/chains';
import { POLYGON_TOKENS, DEPOSIT_ABI } from '@/lib/services/yieldService';

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

// Aave UI Data Provider (this is the correct address for Aave V3 on Polygon)
const AAVE_UI_POOL_DATA_PROVIDER = '0x8F1AD487C9413d7e81aB5B4E88B024Ae3b5637D0';

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

// Aave UI Data Provider ABI (simplified for what we need)
const AAVE_UI_DATA_PROVIDER_ABI = [
  {
    name: 'getReservesData',
    type: 'function',
    inputs: [
      { name: 'provider', type: 'address' }
    ],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'underlyingAsset', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'decimals', type: 'uint256' },
          { name: 'baseLTVasCollateral', type: 'uint256' },
          { name: 'reserveLiquidationThreshold', type: 'uint256' },
          { name: 'reserveLiquidationBonus', type: 'uint256' },
          { name: 'reserveFactor', type: 'uint256' },
          { name: 'usageAsCollateralEnabled', type: 'bool' },
          { name: 'borrowingEnabled', type: 'bool' },
          { name: 'stableBorrowRateEnabled', type: 'bool' },
          { name: 'isActive', type: 'bool' },
          { name: 'isFrozen', type: 'bool' },
          { name: 'liquidityIndex', type: 'uint128' },
          { name: 'variableBorrowIndex', type: 'uint128' },
          { name: 'liquidityRate', type: 'uint128' },
          { name: 'variableBorrowRate', type: 'uint128' },
          { name: 'stableBorrowRate', type: 'uint128' },
          { name: 'lastUpdateTimestamp', type: 'uint40' },
          { name: 'aTokenAddress', type: 'address' },
          { name: 'stableDebtTokenAddress', type: 'address' },
          { name: 'variableDebtTokenAddress', type: 'address' },
          { name: 'interestRateStrategyAddress', type: 'address' },
          { name: 'availableLiquidity', type: 'uint256' },
          { name: 'totalPrincipalStableDebt', type: 'uint256' },
          { name: 'averageStableRate', type: 'uint256' },
          { name: 'stableDebtLastUpdateTimestamp', type: 'uint256' },
          { name: 'totalScaledVariableDebt', type: 'uint256' },
          { name: 'priceInMarketReferenceCurrency', type: 'uint256' },
          { name: 'priceOracle', type: 'address' },
          { name: 'variableRateSlope1', type: 'uint256' },
          { name: 'variableRateSlope2', type: 'uint256' },
          { name: 'stableRateSlope1', type: 'uint256' },
          { name: 'stableRateSlope2', type: 'uint256' },
          { name: 'baseStableBorrowRate', type: 'uint256' },
          { name: 'baseVariableBorrowRate', type: 'uint256' },
          { name: 'optimalUsageRatio', type: 'uint256' },
          { name: 'isPaused', type: 'bool' },
          { name: 'isSiloedBorrowing', type: 'bool' },
          { name: 'accruedToTreasury', type: 'uint128' },
          { name: 'unbacked', type: 'uint128' },
          { name: 'isolationModeTotalDebt', type: 'uint128' },
          { name: 'flashLoanEnabled', type: 'bool' },
          { name: 'debtCeiling', type: 'uint256' },
          { name: 'debtCeilingDecimals', type: 'uint256' },
          { name: 'eModeCategoryId', type: 'uint8' },
          { name: 'borrowCap', type: 'uint256' },
          { name: 'supplyCap', type: 'uint256' },
          { name: 'eModeLtv', type: 'uint16' },
          { name: 'eModeLiquidationThreshold', type: 'uint16' },
          { name: 'eModeLiquidationBonus', type: 'uint16' },
          { name: 'eModePriceSource', type: 'address' },
          { name: 'eModeLabel', type: 'string' },
          { name: 'borrowableInIsolation', type: 'bool' }
        ]
      },
      {
        type: 'tuple',
        components: [
          { name: 'marketReferenceCurrencyUnit', type: 'uint256' },
          { name: 'marketReferenceCurrencyPriceInUsd', type: 'int256' },
          { name: 'networkBaseTokenPriceInUsd', type: 'int256' },
          { name: 'networkBaseTokenPriceDecimals', type: 'uint8' }
        ]
      }
    ],
    stateMutability: 'view',
  }
];

// Helper function to convert Aave's liquidity rate to APR
function convertAaveRateToAPR(liquidityRate: bigint): number {
  // Aave rates are in ray units (10^27) and represent per-second rates
  // Convert to APR: rate * seconds_per_year / 10^27 * 100
  const secondsPerYear = BigInt(31536000);
  const ray = BigInt(10) ** BigInt(27);
  
  const apr = (liquidityRate * secondsPerYear * BigInt(100)) / ray;
  return Number(apr) / 100;
}

// Function to fetch Aave data
async function fetchAaveData(tokenAddress: string): Promise<{ apr: number; tvl: number }> {
  try {
    // Call the Aave UI Data Provider to get all reserves data
    const result = await publicClient.readContract({
      address: AAVE_UI_POOL_DATA_PROVIDER as `0x${string}`,
      abi: AAVE_UI_DATA_PROVIDER_ABI,
      functionName: 'getReservesData',
      args: [AAVE_V3_POOL_ADDRESS as `0x${string}`],
    });
    
    // Ensure the result is properly typed as an array
    const [reservesData] = result as [any[], any];
    
    // Find the reserve data for the specific token
    const tokenData = reservesData.find(
      (reserve: any) => reserve.underlyingAsset.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    if (!tokenData) {
      return { apr: 0, tvl: 0 };
    }
    
    // Convert the liquidity rate to APR
    const apr = convertAaveRateToAPR(tokenData.liquidityRate);
    
    // Calculate TVL in USD
    // Note: availableLiquidity is in token units, we need to convert to USD
    const decimals = Number(tokenData.decimals);
    const availableLiquidity = Number(formatUnits(tokenData.availableLiquidity, decimals));
    
    // priceInMarketReferenceCurrency is the price in ETH (for Polygon)
    // We need to multiply by ETH price in USD to get USD value
    const priceInEth = Number(formatUnits(tokenData.priceInMarketReferenceCurrency, 18));
    
    // For simplicity, we'll use a fixed ETH price, but in production you'd want to fetch this
    const ethPriceInUsd = 2000; // Example price, replace with actual price
    
    const tvl = availableLiquidity * priceInEth * ethPriceInUsd;
    
    return { apr, tvl };
  } catch (error) {
    console.error('Error fetching Aave data:', error);
    return { apr: 0, tvl: 0 };
  }
}

// Function to fetch user balances
async function fetchUserBalances(address: string): Promise<Record<string, number>> {
  try {
    const balances: Record<string, number> = {};
    
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

// Main function to fetch real-time yield opportunities
async function fetchRealTimeYieldOpportunities(address?: string): Promise<any[]> {
  try {
    const opportunities: any[] = [];
    
    // Fetch user balances if address is provided
    const userBalances = address ? await fetchUserBalances(address) : {};
    
    // Fetch Aave opportunities only, since Compound markets on Polygon seem to have issues
    for (const [symbol, tokenAddress] of Object.entries(POLYGON_TOKENS)) {
      try {
        // Fetch Aave data
        const aaveData = await fetchAaveData(tokenAddress);
        
        opportunities.push({
          protocol: 'Aave',
          asset: symbol,
          symbol,
          apr: aaveData.apr,
          tvl: aaveData.tvl,
          userBalance: userBalances[symbol] || 0,
          depositUrl: `https://app.aave.com/reserve-overview/?underlyingAsset=${tokenAddress}&marketName=proto_polygon_v3`,
          contractAddress: AAVE_V3_POOL_ADDRESS,
        });
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
      }
    }
    
    return opportunities;
  } catch (error) {
    console.error('Error fetching real-time yield opportunities:', error);
    return [];
  }
}

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
    // Get the wallet address from the query string
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    console.log(`[API] Fetching yield opportunities for address: ${address || 'none'} with API key: ${ALCHEMY_API_KEY.slice(0, 3)}...`);
    
    // Always return mock data for now to avoid API rate limiting issues
    // This addresses the CORS errors and 429 rate limiting issues with the Alchemy API
    console.log('[API] Returning mock data to avoid rate limiting and CORS issues');
    return NextResponse.json(getMockYieldOpportunities(address), { headers });
    
    // Commented out real API call to avoid rate limiting
    // const opportunities = await fetchRealTimeYieldOpportunities(address || undefined);
    // console.log(`[API] Successfully fetched ${opportunities.length} opportunities`);
    // return NextResponse.json(opportunities);
  } catch (error) {
    console.error('[API] Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yield opportunities', details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers }
    );
  }
}

// Mock data for development when using demo API key
function getMockYieldOpportunities(address?: string | null): any[] {
  const mockData = [
    {
      protocol: 'Aave',
      asset: 'USDC',
      symbol: 'USDC',
      apr: 5.2,
      tvl: 500000000,
      userBalance: address ? 100 : 0,
      depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&marketName=proto_polygon_v3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    },
    {
      protocol: 'Aave',
      asset: 'DAI',
      symbol: 'DAI',
      apr: 4.5,
      tvl: 200000000,
      userBalance: address ? 50 : 0,
      depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&marketName=proto_polygon_v3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    },
    {
      protocol: 'Aave',
      asset: 'WETH',
      symbol: 'WETH',
      apr: 2.1,
      tvl: 800000000,
      userBalance: address ? 0.5 : 0,
      depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&marketName=proto_polygon_v3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    },
    {
      protocol: 'Aave',
      asset: 'WBTC',
      symbol: 'WBTC',
      apr: 1.8,
      tvl: 400000000,
      userBalance: address ? 0.01 : 0,
      depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6&marketName=proto_polygon_v3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    },
    {
      protocol: 'Aave',
      asset: 'MATIC',
      symbol: 'MATIC',
      apr: 3.2,
      tvl: 150000000,
      userBalance: address ? 1000 : 0,
      depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270&marketName=proto_polygon_v3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    },
  ];
  
  return mockData;
}
