# Modular Wallets Demo

This project demonstrates how to create and interact with modular smart contract accounts using Circle's Modular Wallets SDK. The demo showcases how to build a user-friendly wallet experience that enables gasless USDC transfers on Arbitrum Sepolia, highlighting the flexibility and simplicity of Circle's modular wallet infrastructure.

## Features

- 🔐 Modular Wallet Creation
- 💸 Gasless USDC Transfers
- ⚡ Real-time Balance Updates
- 🎨 Modern UI with [shadcn/ui](https://ui.shadcn.com/)

## Prerequisites

Before you begin, you'll need:

1. A Circle Developer Account - Sign up at [Circle's Developer Console](https://console.circle.com/)
2. Node.js 18+ installed
3. A package manager (npm, yarn, or pnpm)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/modular-wallets-demo.git
cd modular-wallets-demo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.sample .env.local
```

4. Configure your environment variables:
   - Get your Circle Client Key and Client URL from the [Circle Developer Console](https://console.circle.com/)
   - Add them to your `.env.local` file:
```
NEXT_PUBLIC_CIRCLE_CLIENT_KEY=your_client_key_here
NEXT_PUBLIC_CIRCLE_CLIENT_URL=your_client_url_here
```

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Connect your wallet using the login form
2. View your wallet address and USDC balance
3. Send gasless USDC transactions to any address on Arbitrum Sepolia

## Network Information

This demo runs on the Arbitrum Sepolia testnet and uses Circle's test USDC token. The relevant contract addresses are:

- USDC Token: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`

## Learn More

- [Circle Developer Documentation](https://developers.circle.com/)
- [Arbitrum Documentation](https://docs.arbitrum.io/)
- [Next.js Documentation](https://nextjs.org/docs)
