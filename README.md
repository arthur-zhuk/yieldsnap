# YieldSnap - DeFi Yield Scanner

YieldSnap is a web application that helps DeFi users find the best yield farming opportunities across multiple protocols. It connects to a user's wallet, scans yield farming opportunities across selected DeFi protocols (e.g., Aave, Compound), displays the best APRs for their assets, and lets them deposit with one click.

## Features

- **Wallet Integration**: Connect to MetaMask or other wallets via WalletConnect
- **Yield Scanning**: Pull APR data from Aave and Compound on Polygon
- **Comparison UI**: View a table of yield opportunities with APRs and balances
- **One-Click Deposit**: Easily deposit into the highest-yield protocol
- **Gas Estimation**: See estimated gas costs before depositing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or another Web3 wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/yield-snap.git
   cd yield-snap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your WalletConnect Project ID:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain Interaction**: ethers.js, wagmi
- **Wallet Connection**: Web3Modal
- **DeFi Protocols**: Aave, Compound (on Polygon)

## Roadmap

- [ ] Add more DeFi protocols (Curve, QuickSwap)
- [ ] Implement auto-compounding features
- [ ] Add multi-chain support (Ethereum, Arbitrum, Optimism)
- [ ] Portfolio tracking for yield earned
- [ ] Implement gas optimization strategies

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Aave](https://aave.com/) - For their lending protocol and API
- [Compound](https://compound.finance/) - For their lending protocol
- [Polygon](https://polygon.technology/) - For providing a low-fee environment for DeFi
