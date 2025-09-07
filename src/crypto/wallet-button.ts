// src/crypto/wallet-button.ts
import { WalletManager } from './WalletManager';

class WalletButton {
  private walletManager: WalletManager;
  private buttonContainer: HTMLDivElement;
  private connectButton: HTMLButtonElement;
  private walletInfo: HTMLDivElement;
  private isInitialized: boolean = false;

  constructor() {
    this.walletManager = WalletManager.getInstance();
    this.createButton();
    this.setupEventListeners();
    this.checkExistingConnection();
  }

  private createButton() {
    // Create main container
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    `;

    // Create connect button
    this.connectButton = document.createElement('button');
    this.connectButton.textContent = 'Connect Wallet';
    this.connectButton.style.cssText = `
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000;
      border: 2px solid #FFB800;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
      transition: all 0.3s ease;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    `;

    // Button hover effects
    this.connectButton.onmouseenter = () => {
      this.connectButton.style.transform = 'translateY(-2px)';
      this.connectButton.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
    };

    this.connectButton.onmouseleave = () => {
      this.connectButton.style.transform = 'translateY(0)';
      this.connectButton.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
    };

    // Create wallet info panel
    this.walletInfo = document.createElement('div');
    this.walletInfo.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border: 2px solid #FFD700;
      border-radius: 10px;
      padding: 15px;
      min-width: 250px;
      font-size: 14px;
      display: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Add elements to container
    this.buttonContainer.appendChild(this.connectButton);
    this.buttonContainer.appendChild(this.walletInfo);

    // Add to page
    document.body.appendChild(this.buttonContainer);
  }

  private setupEventListeners() {
    // Connect button click
    this.connectButton.addEventListener('click', async () => {
      await this.handleConnectClick();
    });

    // Subscribe to wallet state changes
    this.walletManager.subscribe((state) => {
      this.updateUI(state);
    });
  }

  private async checkExistingConnection() {
    // Check if wallet is already connected on page load
    await this.walletManager.checkConnection();
  }

  private async handleConnectClick() {
    const state = this.walletManager.getState();
    
    if (state.isConnected) {
      // If connected, show disconnect option
      const disconnect = confirm('Do you want to disconnect your wallet?');
      if (disconnect) {
        this.walletManager.disconnectWallet();
      }
    } else {
      // Try to connect
      this.connectButton.textContent = 'Connecting...';
      this.connectButton.disabled = true;
      
      const success = await this.walletManager.connectWallet();
      
      if (!success) {
        this.connectButton.textContent = 'Connect Wallet';
        this.connectButton.disabled = false;
      }
    }
  }

  private updateUI(state: any) {
    if (state.isConnected) {
      // Update button
      this.connectButton.textContent = `${state.address.slice(0, 6)}...${state.address.slice(-4)}`;
      this.connectButton.style.background = 'linear-gradient(135deg, #00FF00, #32CD32)';
      this.connectButton.style.borderColor = '#00AA00';
      this.connectButton.disabled = false;

      // Show wallet info
      this.walletInfo.style.display = 'block';
      this.walletInfo.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: #FFD700;">
          🔗 Wallet Connected
        </div>
        <div style="margin-bottom: 5px;">
          📍 <strong>Address:</strong><br>
          <span style="font-family: monospace; font-size: 12px;">${state.address}</span>
        </div>
        <div style="margin-bottom: 5px;">
          💰 <strong>Balance:</strong> ${parseFloat(state.balance).toFixed(4)} ETH
        </div>
        <div style="margin-bottom: 5px;">
          🌐 <strong>Network:</strong> ${this.getNetworkName(state.chainId)}
        </div>
        <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
          Click button to disconnect
        </div>
      `;

    } else {
      // Update button
      this.connectButton.textContent = 'Connect Wallet';
      this.connectButton.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
      this.connectButton.style.borderColor = '#FFB800';
      this.connectButton.disabled = false;

      // Hide wallet info
      this.walletInfo.style.display = 'none';
    }
  }

  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 3: return 'Ropsten Testnet';
      case 4: return 'Rinkeby Testnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Polygon Mumbai';
      case 56: return 'BSC Mainnet';
      case 97: return 'BSC Testnet';
      case 31337: return 'Localhost';
      default: return `Chain ID: ${chainId}`;
    }
  }

  // Public method to get wallet state
  public getWalletState() {
    return this.walletManager.getState();
  }

  // Public method to manually update balance
  public async updateBalance() {
    await this.walletManager.updateBalance();
  }
}

// Create wallet button when page loads
if (typeof window !== 'undefined') {
  let walletButton: WalletButton;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      walletButton = new WalletButton();
    });
  } else {
    walletButton = new WalletButton();
  }

  // Export for global access
  (window as any).walletButton = walletButton;
}

export { WalletButton };