'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

// Define the context type
interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

// Create the context with default values
const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  isConnected: false,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

// Hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context);

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Function to connect wallet
  const connectWallet = async () => {
    try {
      // Check if window.ethereum is available
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create ethers provider
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
        
        // Get signer
        const ethersSigner = await ethersProvider.getSigner();
        setSigner(ethersSigner);
        
        // Get address
        const signerAddress = await ethersSigner.getAddress();
        setAddress(signerAddress);
        
        // Get chain ID
        const network = await ethersProvider.getNetwork();
        setChainId(Number(network.chainId));
        
        setIsConnected(true);
      } else {
        alert('Please install MetaMask or another Ethereum wallet extension');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // User switched accounts
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        // Chain changed, update provider and chainId
        setChainId(parseInt(chainIdHex, 16));
        
        // Refresh provider
        if (window.ethereum) {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethersProvider);
          
          // Update signer
          ethersProvider.getSigner().then(ethersSigner => {
            setSigner(ethersSigner);
          });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        isConnected,
        chainId,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
} 