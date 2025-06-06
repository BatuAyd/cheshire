# Cheshire Liquid Voting App

A liquid voting platform with user profiles, JWT authentication, and proposal creation system, built with React, TypeScript, Express, Upstash Redis, and PostgreSQL.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + TailwindCSS + Wagmi + RainbowKit
- **Backend**: Express.js + Redis (Upstash recommended, local Redis alternative) + PostgreSQL (user data)
- **Authentication**: JWT-based with wallet signing (SIWE pattern)
- **Database**: PostgreSQL for user profiles, organizations, proposals, and JWT sessions (Supabase recommended)
- **Session Management**: JWT tokens with 36-hour expiration stored in PostgreSQL

## Features

- **Wallet Authentication** - Connect MetaMask/WalletConnect and sign messages
- **User Profile System** - One-time immutable profile setup
- **JWT Session Management** - Secure token-based authentication with database validation
- **Route Protection** - Enforce profile completion for protected routes
- **Real-time Validation** - Unique ID and organization validation
- **Organization Support** - Associate users with organizations
- **Proposal Creation** - Create proposals with voting options and deadlines
- **Proposal Management** - Organization-scoped proposal system with validation
- **Redis Integration** - Redis ready for future voting calculations (Upstash or local)

## Quick Setup

### 1. Prerequisites

- Node.js 18+
- Redis database (Upstash recommended for easy setup, or local Redis)
- PostgreSQL database (Supabase recommended for easy setup, or local PostgreSQL)

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

**Option 1: Upstash Redis (Recommended)**

1. Create account at [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Copy the REST API URL and token from the dashboard
4. Add to server `.env` file (see Environment Variables section)

**Option 2: Local Redis**

```bash
# Install Redis (macOS)
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

For local Redis, use different environment variables (see Environment Variables section).

**Note:** The current implementation uses `@upstash/redis` package for Upstash. For local Redis, install `redis` package instead and update the connection code in `server.js`.

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
('bilgi_university', 'Bilgi University'),
('fens', 'Faculty of Engineering and Natural Sciences'),
('cmpe', 'Computer Engineering Department');
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

**User Sessions Table (for JWT management):**

```sql
CREATE TABLE user_sessions (
  jwt_token TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_user_sessions_wallet_address ON user_sessions(wallet_address);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
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

4. Get Supabase credentials:
   - Go to **Settings** → **API**
   - Copy Project URL and service_role key

#### Alternative: Local PostgreSQL

You can use any PostgreSQL database instead of Supabase. Just update the connection details in your environment variables and modify `database/supabase.js` to use a standard PostgreSQL client.

### 4. Environment Variables

#### Frontend (.env in cheshire/)

```env
VITE_INFURA_API_KEY=your_infura_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

#### Server (.env in server/)

```env
# Node Environment
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Supabase Configuration (PostgreSQL + JWT sessions)
SUPABASE_URL=https://project-id.supabase.co
SUPABASE_SERVICE_KEY=service_role_key_here

# Redis Configuration - Option 1: Upstash (Recommended)
UPSTASH_REDIS_REST_URL=https://redis-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=upstash_token_here

# Redis Configuration - Option 2: Local Redis (Alternative)
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=

# JWT Secret (defaults to SUPABASE_SERVICE_KEY when using Supabase)
# JWT_SECRET=custom_jwt_secret_here
```

### 5. Run the Application

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

## User Flow

### New Users

1. **Connect Wallet** - Connect MetaMask or other wallet
2. **Complete Setup** - Fill out profile form (one-time only)
3. **Sign In** - Sign message to get JWT token
4. **Access App** - Full access to proposals and proposal creation

### Existing Users

1. **Connect Wallet** - Connect same wallet as before
2. **Sign In** - Authenticate to get fresh JWT token
3. **Immediate Access** - Direct access to app features

### Protected Routes

- `/proposals` - Requires JWT authentication + completed profile
- `/categories` - Requires JWT authentication + completed profile
- `/profile` - Display user profile information
- `/create-proposal` - Create new proposals (requires organization membership)
- `/setup` - One-time profile setup (redirects if already completed)

## API Endpoints

### Authentication (JWT-based)

- `GET /api/auth/nonce` - Get signing nonce
- `POST /api/auth/signin` - Sign in and get JWT token
- `GET /api/auth/me` - Check current JWT token
- `POST /api/auth/signout` - Invalidate JWT token
- `GET /api/auth/check-user?address=0x...` - Check if user has completed profile

### User Management

- `GET /api/user/exists?address=0x...` - Check if user exists
- `GET /api/user/profile` - Get user profile data (JWT required)
- `POST /api/user/create` - Create new user profile
- `GET /api/user/unique-id/check?id=...` - Check unique ID availability
- `GET /api/user/organization/check?id=...` - Check organization exists
- `GET /api/user/organizations` - List all organizations

### Proposal Management (JWT required)

- `POST /api/proposals/create` - Create new proposal with voting options
- `GET /api/proposals/my-proposals` - Get user's created proposals
- `GET /api/proposals/organization` - Get organization's proposals
- `GET /api/proposals/can-create` - Check if user can create proposals
- `GET /api/proposals/:id` - Get proposal by ID

### System Status

- `GET /api/status` - System health check (PostgreSQL + Redis)
- `GET /api/debug/redis` - Redis connection details

## External Services Required

1. **WalletConnect Project ID** - Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. **Infura API Key** - Get from [Infura](https://infura.io/)
3. **PostgreSQL Database** - [Supabase](https://supabase.com/) recommended or any PostgreSQL instance
4. **Redis Database** - [Upstash](https://upstash.com/) recommended for voting calculations, or local Redis

## Development Notes

- User profile data is **immutable** after creation
- Proposals are **immutable** after creation (no editing allowed)
- JWT tokens expire after 36 hours and are stored in Supabase for validation
- Expired JWT sessions are automatically cleaned up every 12 hours
- All protected routes require valid JWT tokens via Authorization headers
- PostgreSQL database can be local, cloud-hosted, or Supabase
- When using Supabase, the service_role key bypasses Row Level Security for server operations
- JWT authentication uses SUPABASE_SERVICE_KEY as the signing secret when using Supabase
- Proposals are organization-scoped (users can only create proposals for their organization)
- Voting deadlines must be at least 1 hour from creation time
- Redis is used for voting calculations, not authentication (which uses JWT tokens)
- Local Redis or Upstash Redis can be used depending on deployment preference
- Wallet address changes automatically clear auth state and redirect to clean connection
