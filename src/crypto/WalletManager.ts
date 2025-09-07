// src/crypto/WalletManager.ts
import { ethers } from 'ethers';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
}

export class WalletManager {
  private static instance: WalletManager;
  private state: WalletState;
  private listeners: Array<(state: WalletState) => void> = [];

  private constructor() {
    this.state = {
      isConnected: false,
      address: null,
      balance: '0',
      chainId: null,
    };
    
    // Listen for MetaMask account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        this.connectWallet(); // Reconnect on chain change
      });
    }
  }

  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  // Connect wallet
  public async connectWallet(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return false;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        console.log('No accounts found');
        return false;
      }

      // Get provider and network info
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      // Update state
      this.state = {
        isConnected: true,
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
      };

      this.notifyListeners();
      console.log('✅ Wallet connected:', this.state);
      return true;

    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      return false;
    }
  }

  // Disconnect wallet
  public disconnectWallet(): void {
    this.state = {
      isConnected: false,
      address: null,
      balance: '0',
      chainId: null,
    };
    this.notifyListeners();
    console.log('🔌 Wallet disconnected');
  }

  // Get current state
  public getState(): WalletState {
    return { ...this.state };
  }

  // Subscribe to state changes
  public subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Update balance
  public async updateBalance(): Promise<void> {
    if (!this.state.address || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(this.state.address);
      this.state.balance = ethers.formatEther(balance);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  }

  // Check if already connected (on page load)
  public async checkConnection(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });

      if (accounts.length > 0) {
        return await this.connectWallet();
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check connection:', error);
      return false;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// TypeScript global declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}