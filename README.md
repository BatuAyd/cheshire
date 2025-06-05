# Cheshire Liquid Voting App

A liquid voting platform with user profiles, session management, and proposal creation system, built with React, TypeScript, Express, Redis, and PostgreSQL.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + TailwindCSS + Wagmi + RainbowKit
- **Backend**: Express.js + Redis (sessions) + PostgreSQL (user data)
- **Authentication**: Wallet-based with SIWE (Sign-In with Ethereum)
- **Database**: PostgreSQL for user profiles, organizations, and proposals (Supabase recommended but any PostgreSQL works)
- **Session Management**: Redis with 36-hour TTL

## Features

- **Wallet Authentication** - Connect MetaMask/WalletConnect and sign messages  
- **User Profile System** - One-time immutable profile setup  
- **Session Management** - Redis-based sessions with caching  
- **Route Protection** - Enforce profile completion for protected routes  
- **Real-time Validation** - Unique ID and organization validation  
- **Organization Support** - Associate users with organizations  
- **Proposal Creation** - Create proposals with voting options and deadlines
- **Proposal Management** - Organization-scoped proposal system with validation

## Quick Setup

### 1. Prerequisites

- Node.js 18+ 
- Redis server running locally
- PostgreSQL database (Supabase recommended for easy setup)

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd cheshire
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Database Setup

#### Redis Setup
```bash
# Install Redis (macOS)
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### PostgreSQL Setup with Supabase (Recommended)
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Go to **Table Editor** and create tables:

**Organizations Table:**
```sql
CREATE TABLE organizations (
  organization_id text PRIMARY KEY,
  organization_name text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- Insert sample data
INSERT INTO organizations (organization_id, organization_name) VALUES
('', ''),
('', ''),
('', '');
```

**Users Table:**
```sql
CREATE TABLE users (
  wallet_address text PRIMARY KEY,
  unique_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  organization_id text REFERENCES organizations(organization_id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create index for organization queries (wallet_address and unique_id indexes are automatic)
CREATE INDEX idx_users_organization_id ON users(organization_id);
```

**Proposals Table:**
```sql
CREATE TABLE proposals (
  proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) >= 10 AND length(trim(title)) <= 100),
  description TEXT NOT NULL CHECK (length(trim(description)) >= 50 AND length(trim(description)) <= 1000),
  voting_deadline TIMESTAMPTZ NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by TEXT NOT NULL REFERENCES users(wallet_address),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT voting_deadline_future CHECK (voting_deadline > created_at + INTERVAL '1 hour')
);

-- Create indexes for performance
CREATE INDEX idx_proposals_organization_id ON proposals(organization_id);
CREATE INDEX idx_proposals_created_by ON proposals(created_by);
CREATE INDEX idx_proposals_voting_deadline ON proposals(voting_deadline);
CREATE INDEX idx_proposals_created_at ON proposals(created_at);
```

**Proposal Options Table:**
```sql
CREATE TABLE proposal_options (
  proposal_id UUID NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  option_number INTEGER NOT NULL CHECK (option_number >= 1 AND option_number <= 10),
  option_text TEXT NOT NULL CHECK (length(trim(option_text)) >= 3 AND length(trim(option_text)) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (proposal_id, option_number),
  UNIQUE(proposal_id, option_text)
);

-- Create index for faster queries
CREATE INDEX idx_proposal_options_proposal_id ON proposal_options(proposal_id);
```

4. Get your Supabase credentials:
   - Go to **Settings** → **API**
   - Copy Project URL and service_role key

#### Alternative: Local PostgreSQL
You can use any PostgreSQL database instead of Supabase. Just update the connection details in your environment variables and modify `database/supabase.js` to use a standard PostgreSQL client.

### 4. Environment Variables

#### Frontend (.env in cheshire/)
```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_INFURA_API_KEY=your_infura_api_key
```

#### Server (.env in server/)
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
NODE_ENV=development

# Session Configuration
SESSION_TTL=129600
# 129600 seconds = 36 hours

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Supabase Configuration (or your PostgreSQL connection)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 5. Run the Application
```bash
# Terminal 1: Start Redis (if not running as service)
redis-server

# Terminal 2: Start the server
cd server
npm run dev

# Terminal 3: Start the frontend
cd cheshire
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Server: http://localhost:8080

## User Flow

### New Users
1. **Connect Wallet** - Connect MetaMask or other wallet
2. **Sign Message** - Sign authentication message
3. **Complete Setup** - Fill out profile form (one-time only)
4. **Access App** - Full access to proposals, categories, and proposal creation

### Existing Users
1. **Connect Wallet** - Connect same wallet as before
2. **Sign Message** - Authenticate with existing session
3. **Immediate Access** - Skip setup, direct access to app

### Protected Routes
- `/proposals` - Requires authentication + profile setup
- `/categories` - Requires authentication + profile setup  
- `/profile` - Display user profile information
- `/create-proposal` - Create new proposals (requires organization membership)
- `/setup` - One-time profile setup (blocked after completion)

## API Endpoints

### Authentication
- `GET /api/nonce` - Get signing nonce
- `POST /api/verify` - Verify signature and create session
- `GET /api/me` - Check current session
- `POST /api/logout` - Destroy session

### User Management
- `GET /api/user/exists?address=0x...` - Check if user exists
- `GET /api/user/profile` - Get user profile data
- `POST /api/user/create` - Create new user profile
- `GET /api/user/unique-id/check?id=...` - Check unique ID availability
- `GET /api/user/organization/check?id=...` - Check organization exists
- `GET /api/user/organizations` - List all organizations

### Proposal Management
- `POST /api/proposals/create` - Create new proposal with voting options
- `GET /api/proposals/my-proposals` - Get user's created proposals
- `GET /api/proposals/organization` - Get organization's proposals
- `GET /api/proposals/can-create` - Check if user can create proposals

## External Services Required

1. **WalletConnect Project ID** - Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. **Infura API Key** - Get from [Infura](https://infura.io/)
3. **PostgreSQL Database** - [Supabase](https://supabase.com/) recommended or any PostgreSQL instance

## Development Notes

- User profile data is **immutable** after creation
- Proposals are **immutable** after creation (no editing allowed)
- Sessions are cached locally for 6 minutes to reduce server calls
- Redis stores sessions with 36-hour expiration
- All user routes require Redis session authentication
- PostgreSQL database can be local, cloud-hosted, or Supabase
- If using Supabase, the service_role key bypasses Row Level Security for server operations
- Proposals are organization-scoped (users can only create for their organization)
- Voting deadlines must be at least 1 hour from creation time
