Collecting workspace information# Cheshire Liquid Voting App

A decentralized liquid voting platform built with React, TypeScript, and Express.

## Quick Setup

### 1. Install Dependencies
```bash
# Install frontend dependencies
cd cheshire
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Environment Variables
Create .env with:
```env
VITE_PROJECT_ID=your_walletconnect_project_id
VITE_INFURA_API_KEY=your_infura_api_key
```

### 3. Run the Application
```bash
# Terminal 1: Start the server
cd server
npm run dev

# Terminal 2: Start the frontend
cd cheshire
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Server: http://localhost:8080

### 4. Connect & Test
1. Connect your wallet (MetaMask recommended)
2. Switch to Sepolia testnet
3. Click "Sign In" and sign the message
4. Access protected routes after authentication

**Note:** You'll need a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) and an Infura API key from [Infura](https://infura.io/).
