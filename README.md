# YieldSnap

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Web3](https://img.shields.io/badge/Web3-F16822?style=for-the-badge&logo=web3.js&logoColor=white)
![Polygon](https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white)

DeFi yield scanner that helps users find the best yield farming opportunities across multiple protocols. Connect your wallet, scan yield opportunities, and deposit with one click.

## Features

- **Wallet Integration**: Connect to MetaMask or other wallets via WalletConnect
- **Yield Scanning**: Pull APR data from Aave and Compound on Polygon
- **Comparison UI**: View a table of yield opportunities with APRs and balances
- **One-Click Deposit**: Easily deposit into the highest-yield protocol
- **Gas Estimation**: See estimated gas costs before depositing

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain Interaction**: ethers.js, wagmi
- **Wallet Connection**: Web3Modal
- **DeFi Protocols**: Aave, Compound (on Polygon)
- **Language**: TypeScript

## Installation

```bash
git clone https://github.com/arthur-zhuk/yieldsnap.git
cd yieldsnap
npm install
```

### Prerequisites

- Node.js 18+ and npm
- MetaMask or another Web3 wallet

### Environment Setup

Create a `.env.local` file in the root directory with your WalletConnect Project ID:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Usage

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Connect Wallet**: Click "Connect Wallet" and authorize the connection
2. **View Opportunities**: Browse yield opportunities across Aave and Compound
3. **Compare APRs**: See which protocol offers the best yield for your assets
4. **Deposit**: Click "Deposit" to deposit into your chosen protocol
5. **Monitor**: Track your deposits and yield earnings

## Roadmap

- [ ] Add more DeFi protocols (Curve, QuickSwap)
- [ ] Implement auto-compounding features
- [ ] Add multi-chain support (Ethereum, Arbitrum, Optimism)
- [ ] Portfolio tracking for yield earned
- [ ] Implement gas optimization strategies

## Acknowledgments

- [Aave](https://aave.com/) - For their lending protocol and API
- [Compound](https://compound.finance/) - For their lending protocol
- [Polygon](https://polygon.technology/) - For providing a low-fee environment for DeFi

## License

MIT
