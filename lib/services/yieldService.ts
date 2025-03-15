'use client';

import axios from 'axios';
import { formatUnits, parseUnits, type WalletClient } from 'viem';
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
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Polygon
  },
  {
    protocol: 'Compound',
    asset: 'USDC',
    symbol: 'USDC',
    apr: 4.8,
    tvl: 300000000,
    userBalance: 100,
    depositUrl: 'https://app.compound.finance/',
    contractAddress: '0xF25212E676D1F7F89Cd72fFEe66158f541246445', // Compound on Polygon
  },
  {
    protocol: 'Aave',
    asset: 'DAI',
    symbol: 'DAI',
    apr: 4.5,
    tvl: 200000000,
    userBalance: 50,
    depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&marketName=proto_polygon_v3',
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Polygon
  },
  {
    protocol: 'Compound',
    asset: 'DAI',
    symbol: 'DAI',
    apr: 4.2,
    tvl: 150000000,
    userBalance: 50,
    depositUrl: 'https://app.compound.finance/',
    contractAddress: '0xF25212E676D1F7F89Cd72fFEe66158f541246445', // Compound on Polygon
  },
  {
    protocol: 'Aave',
    asset: 'WETH',
    symbol: 'WETH',
    apr: 2.1,
    tvl: 800000000,
    userBalance: 0.5,
    depositUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&marketName=proto_polygon_v3',
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Polygon
  },
  {
    protocol: 'Compound',
    asset: 'WETH',
    symbol: 'WETH',
    apr: 1.9,
    tvl: 600000000,
    userBalance: 0.5,
    depositUrl: 'https://app.compound.finance/',
    contractAddress: '0xF25212E676D1F7F89Cd72fFEe66158f541246445', // Compound on Polygon
  },
];

// Common token addresses on Polygon
export const POLYGON_TOKENS = {
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
};

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
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
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
];

// ABI for deposit function (simplified for example)
export const DEPOSIT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

// Function to get yield opportunities
export async function getYieldOpportunities(address?: string): Promise<YieldOpportunity[]> {
  try {
    // In a real implementation, we would fetch data from Aave and Compound APIs
    // For now, we'll use mock data or fetch from our API
    
    // If no address is provided, return opportunities with zero balance
    if (!address) {
      return mockYieldData.map(opportunity => ({
        ...opportunity,
        userBalance: 0,
      }));
    }
    
    // In a real implementation, we would fetch user balances and update the opportunities
    // For now, we'll just return the mock data
    return mockYieldData;
  } catch (error) {
    console.error('Error fetching yield opportunities:', error);
    return [];
  }
}

// Function to deposit into a protocol (mock implementation)
export async function depositToProtocol(
  opportunity: YieldOpportunity,
  amount: number,
  address: string,
  walletClient?: WalletClient
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // In a real implementation, we would create and send a transaction
    // For now, we'll just simulate a successful deposit
    
    console.log(`Depositing ${amount} ${opportunity.symbol} to ${opportunity.protocol} for ${address}`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock transaction hash
    return {
      success: true,
      txHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
  } catch (error) {
    console.error('Error depositing:', error);
    return {
      success: false,
      error: 'Transaction failed'
    };
  }
} 