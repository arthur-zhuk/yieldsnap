'use client';

import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { polygon } from 'wagmi/chains';
import { POLYGON_TOKENS, DEPOSIT_ABI } from './yieldService';
import { YieldOpportunity } from '@/components/yield-scanner/YieldTable';

// Create a public client for Polygon that uses our API route as a proxy
// This avoids CORS issues and rate limiting by proxying through our Next.js API
const publicClient = createPublicClient({
  chain: polygon,
  transport: http('/api/polygon'),  // Use our API route as a proxy
});

// Aave V3 Pool contract address on Polygon
const AAVE_V3_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';

// Aave UI Data Provider (this is the correct address for Aave V3 on Polygon)
const AAVE_UI_POOL_DATA_PROVIDER = '0x8F1AD487C9413d7e81aB5B4E88B024Ae3b5637D0';

// ERC20 ABI for approval and balance checking
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
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
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

// Function to estimate gas for deposit
export async function estimateGasForDeposit(
  protocol: string,
  tokenAddress: string,
  amount: number,
  userAddress: string
): Promise<string> {
  try {
    // Return default value for empty token addresses to avoid unnecessary API calls
    if (!tokenAddress) {
      return "~0.01 MATIC";
    }
    
    // Use our API endpoint to get gas estimate
    const response = await fetch(`/api/polygon/gas-estimate?protocol=${encodeURIComponent(protocol)}&tokenAddress=${encodeURIComponent(tokenAddress)}&amount=${amount}&userAddress=${encodeURIComponent(userAddress)}`);
    
    if (!response.ok) {
      console.warn(`Gas estimate API returned status ${response.status}. Using default value.`);
      return "~0.01 MATIC";
    }
    
    const data = await response.json();
    return data.gasEstimate || "~0.01 MATIC"; // Fallback value
  } catch (error) {
    console.error('Error estimating gas:', error);
    return "~0.01 MATIC"; // Default estimate on error
  }
}

// Function to fetch user balances
export async function fetchUserBalances(address: string): Promise<Record<string, number>> {
  try {
    // Use our API endpoint to get user balances
    const response = await fetch(`/api/polygon/balances?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user balances:', error);
    return {};
  }
}

// Main function to fetch real-time yield opportunities
export async function fetchRealTimeYieldOpportunities(address?: string): Promise<YieldOpportunity[]> {
  try {
    // Use our API endpoint to get yield opportunities
    const url = address 
      ? `/api/polygon?address=${encodeURIComponent(address)}` 
      : '/api/polygon';
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching yield opportunities:', error);
    return [];
  }
}
