# Cheshire

A liquid democracy platform that enables users to vote directly on proposals or delegate their voting power to trusted experts. Built with React, Node.js, PostgreSQL, and Redis.

## Features

- **Liquid Voting System**: Vote directly or delegate to experts with automatic chain resolution
- **Category Based Expertise**: Follow category experts for voting recommendations and guidance
- **Organization Management**: Secure organization based access with JWT authentication
- **Proposal Management**: Create, view, and participate in organizational decision making
- **Profile System**: User profiles with unique identifiers for delegation
- **Real Time Processing**: Redis backed voting system with automated delegation resolution
- **Audit Trails**: Complete transparency with comprehensive voting and delegation logging
- **Backup Systems**: Automated data backup and disaster recovery capabilities

## Technology Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- React Router for navigation
- Wagmi + RainbowKit for wallet integration
- TanStack Query for state management

### Backend
- Node.js with Express
- PostgreSQL via Supabase
- Upstash Redis for voting calculations
- JWT authentication
- CORS enabled API

### Infrastructure
- Supabase for database and real time features
- Upstash Redis for liquid voting operations
- Environment based configuration

## Architecture

### Liquid Democracy Implementation

The liquid voting system allows users to:
- **Vote Directly**: Cast votes on proposals they understand or care about
- **Delegate Power**: Assign voting power to trusted experts in specific areas
- **Chain Resolution**: Automatic delegation chain following with cycle detection
- **Weighted Counting**: Final vote tallies respect delegation chains and voting power

### Data Flow
1. **Vote Storage**: Redis stores real time voting and delegation data
2. **Chain Resolution**: Automated processing resolves delegation chains using graph algorithms
3. **Vote Counting**: Final tallies calculated with proper voting power weights
4. **Audit Trail**: All actions logged to PostgreSQL for transparency
5. **Backup System**: Hourly Redis snapshots stored for disaster recovery

## Database

The system uses PostgreSQL for persistent data storage with the following schema:

### Core Tables
- **organizations** - Organization management
- **users** - User profiles with wallet addresses and unique identifiers
- **proposals** - Proposal data with voting deadlines and validation
- **proposal_options** - Voting options for each proposal (1-10 options)

### Category System
- **categories** - Expert categories for delegation guidance
- **category_followers** - User subscriptions to expert categories
- **category_suggestions** - Expert voting recommendations

### Liquid Voting and Audit
- **vote_audit** - Complete audit trail for all voting actions
- **delegation_resolution_audit** - Delegation chain resolution results
- **final_vote_results_audit** - Final vote counting with metadata
- **redis_snapshots** - Backup system for Redis voting data

### Authentication
- **user_sessions** - JWT token management and session control

### Schema

```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  category_id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  created_by text NOT NULL,
  title text NOT NULL CHECK (length(TRIM(BOTH FROM title)) >= 5 AND length(TRIM(BOTH FROM title)) <= 30),
  description text NOT NULL CHECK (length(TRIM(BOTH FROM description)) >= 50 AND length(TRIM(BOTH FROM description)) <= 1000),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (category_id),
  CONSTRAINT categories_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(wallet_address)
);

CREATE TABLE public.category_followers (
  category_id uuid NOT NULL,
  follower_wallet text NOT NULL,
  followed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT category_followers_pkey PRIMARY KEY (category_id, follower_wallet),
  CONSTRAINT category_followers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id),
  CONSTRAINT category_followers_follower_wallet_fkey FOREIGN KEY (follower_wallet) REFERENCES public.users(wallet_address)
);

CREATE TABLE public.category_suggestions (
  suggestion_id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  proposal_id uuid NOT NULL,
  suggestion_type text NOT NULL CHECK (suggestion_type = ANY (ARRAY['delegate'::text, 'vote_option'::text])),
  target_user text,
  target_option_number integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT category_suggestions_pkey PRIMARY KEY (suggestion_id),
  CONSTRAINT category_suggestions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id),
  CONSTRAINT category_suggestions_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(proposal_id),
  CONSTRAINT category_suggestions_proposal_id_target_option_number_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposal_options(proposal_id),
  CONSTRAINT category_suggestions_proposal_id_target_option_number_fkey FOREIGN KEY (target_option_number) REFERENCES public.proposal_options(proposal_id),
  CONSTRAINT category_suggestions_proposal_id_target_option_number_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposal_options(option_number),
  CONSTRAINT category_suggestions_proposal_id_target_option_number_fkey FOREIGN KEY (target_option_number) REFERENCES public.proposal_options(option_number),
  CONSTRAINT category_suggestions_target_user_fkey FOREIGN KEY (target_user) REFERENCES public.users(unique_id)
);

CREATE TABLE public.delegation_resolution_audit (
  resolution_id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL UNIQUE,
  resolution_data jsonb NOT NULL CHECK (resolution_data ? 'proposalId'::text AND resolution_data ? 'computedAt'::text AND resolution_data ? 'delegationResolution'::text AND resolution_data ? 'votingPowers'::text AND resolution_data ? 'metadata'::text),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  computation_time_ms integer,
  status text NOT NULL DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['completed'::text, 'error'::text, 'partial'::text])),
  error_message text,
  total_participants integer NOT NULL DEFAULT 0,
  direct_voters integer NOT NULL DEFAULT 0,
  delegators integer NOT NULL DEFAULT 0,
  orphaned_chains integer NOT NULL DEFAULT 0,
  longest_chain_length integer NOT NULL DEFAULT 0,
  CONSTRAINT delegation_resolution_audit_pkey PRIMARY KEY (resolution_id),
  CONSTRAINT delegation_resolution_audit_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(proposal_id)
);

CREATE TABLE public.final_vote_results_audit (
  result_id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL UNIQUE,
  vote_results jsonb NOT NULL,
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  computation_time_ms integer,
  status text NOT NULL DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['completed'::text, 'error'::text])),
  error_message text,
  total_voting_power integer NOT NULL DEFAULT 0,
  total_votes_cast integer NOT NULL DEFAULT 0,
  winning_option integer,
  CONSTRAINT final_vote_results_audit_pkey PRIMARY KEY (result_id),
  CONSTRAINT final_vote_results_audit_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(proposal_id)
);

CREATE TABLE public.organizations (
  organization_id text NOT NULL UNIQUE,
  organization_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (organization_id)
);

CREATE TABLE public.proposal_options (
  proposal_id uuid NOT NULL,
  option_number integer NOT NULL CHECK (option_number >= 1 AND option_number <= 10),
  option_text text NOT NULL CHECK (length(TRIM(BOTH FROM option_text)) >= 3 AND length(TRIM(BOTH FROM option_text)) <= 200),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT proposal_options_pkey PRIMARY KEY (proposal_id, option_number),
  CONSTRAINT proposal_options_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(proposal_id)
);

CREATE TABLE public.proposals (
  proposal_id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(TRIM(BOTH FROM title)) >= 10 AND length(TRIM(BOTH FROM title)) <= 100),
  description text NOT NULL CHECK (length(TRIM(BOTH FROM description)) >= 50 AND length(TRIM(BOTH FROM description)) <= 1000),
  voting_deadline timestamp with time zone NOT NULL,
  organization_id text NOT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT proposals_pkey PRIMARY KEY (proposal_id),
  CONSTRAINT proposals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id),
  CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(wallet_address)
);

CREATE TABLE public.redis_snapshots (
  snapshot_id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  redis_data jsonb NOT NULL CHECK (redis_data ? 'timestamp'::text AND redis_data ? 'votes'::text AND redis_data ? 'delegations'::text),
  snapshot_type text NOT NULL CHECK (snapshot_type = ANY (ARRAY['hourly'::text, 'pre_calculation'::text, 'manual'::text])),
  snapshot_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT redis_snapshots_pkey PRIMARY KEY (snapshot_id),
  CONSTRAINT redis_snapshots_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(proposal_id)
);

CREATE TABLE public.user_sessions (
  jwt_token text NOT NULL,
  wallet_address text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (jwt_token),
  CONSTRAINT user_sessions_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address)
);

CREATE TABLE public.users (
  wallet_address text NOT NULL UNIQUE,
  unique_id text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  organization_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (wallet_address),
  CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id)
);

CREATE TABLE public.vote_audit (
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  user_wallet text NOT NULL,
  organization_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['vote'::text, 'remove_vote'::text, 'delegate'::text, 'remove_delegation'::text])),
  target text,
  target_wallet text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vote_audit_pkey PRIMARY KEY (audit_id),
  CONSTRAINT vote_audit_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(proposal_id),
  CONSTRAINT vote_audit_user_wallet_fkey FOREIGN KEY (user_wallet) REFERENCES public.users(wallet_address),
  CONSTRAINT vote_audit_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id),
  CONSTRAINT vote_audit_target_wallet_fkey FOREIGN KEY (target_wallet) REFERENCES public.users(wallet_address)
);
```

## API Endpoints

### Authentication
- `GET /api/auth/nonce` - Generate signing nonce
- `GET /api/auth/check-user` - Check user profile status
- `POST /api/auth/signin` - JWT authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/signout` - Invalidate session

### User Management
- `GET /api/user/exists` - Check if user exists
- `GET /api/user/unique-id/check` - Validate unique ID availability
- `GET /api/user/organization/check` - Verify organization exists
- `GET /api/user/organizations` - List available organizations
- `GET /api/user/profile` - Get user profile
- `POST /api/user/create` - Create new user profile
- `GET /api/user/organization/users` - Get organization members

### Proposals
- `POST /api/proposals/create` - Create new proposal
- `GET /api/proposals/my-proposals` - Get user proposals
- `GET /api/proposals/organization` - Get organization proposals
- `GET /api/proposals/can-create` - Check creation permissions
- `GET /api/proposals/:id` - Get proposal details
- `GET /api/proposals/:id/suggestions` - Get category suggestions

### Liquid Voting
- `POST /api/proposals/:id/vote` - Cast direct vote
- `DELETE /api/proposals/:id/vote` - Remove vote
- `POST /api/proposals/:id/delegate` - Set delegation
- `DELETE /api/proposals/:id/delegate` - Remove delegation
- `GET /api/proposals/:id/voting-status` - Get user voting status

### Categories
- `GET /api/categories/organization` - Get organization categories
- `POST /api/categories/create` - Create new category
- `GET /api/categories/:id` - Get category details
- `POST /api/categories/:id/follow` - Follow category
- `DELETE /api/categories/:id/follow` - Unfollow category
- `POST /api/categories/:id/suggest` - Create voting suggestion

### System
- `GET /api/status` - System health check
- `GET /api/debug/redis` - Redis connection status

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Upstash Redis account
- Infura API key
- WalletConnect Project ID

### Environment Configuration

#### Backend (.env)
```bash
# Redis Configuration (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Session Configuration
SESSION_TTL=129600
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT Secret (optional, defaults to SUPABASE_SERVICE_KEY)
JWT_SECRET=your_jwt_secret
```

#### Frontend (.env)
```bash
# Backend API URL
VITE_BACKEND_URL=http://localhost:8080

# Infura Configuration
VITE_INFURA_API_KEY=your_infura_key

# WalletConnect Configuration
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Database Setup

1. Create a Supabase project
2. Run the database migrations to create all required tables
3. Set up Row Level Security policies if needed
4. Configure foreign key constraints for data integrity

### Redis Setup

1. Create an Upstash Redis database
2. Copy the REST URL and token to your environment
3. The system will automatically handle key patterns and TTL management
4. Backup system will create hourly snapshots automatically

### Installation

#### Backend
```bash
cd server
npm install
npm run dev
```

#### Frontend
```bash
cd cheshire
npm install
npm run dev
```

### Development Workflow

1. **Wallet Connection**: Users connect Ethereum wallets via RainbowKit
2. **Profile Creation**: Complete user profile with organization membership
3. **Authentication**: Sign message for JWT token authentication
4. **Proposal Participation**: Vote directly or delegate to experts
5. **Category Following**: Subscribe to expert categories for guidance
6. **Liquid Democracy**: System automatically resolves delegation chains

## Liquid Voting Process

### Vote Casting
1. User selects proposal option
2. Vote stored in Redis with rate limiting
3. Any existing delegation automatically removed
4. Action logged to audit trail

### Delegation
1. User selects expert by unique ID
2. Cycle detection prevents circular delegations
3. Chain length validation ensures system performance
4. Delegation stored in Redis with audit logging

### Chain Resolution
1. Automated processing every 24 hours for expired proposals
2. Graph traversal algorithms resolve delegation chains
3. Voting power calculated based on chain endpoints
4. Results stored in PostgreSQL audit tables

### Final Counting
1. Weighted vote tallies respect delegation chains
2. Each user contributes exactly one unit of voting power
3. Final results include detailed voter breakdowns
4. Winning options determined by highest weighted totals

## Security Features

- **Cycle Detection**: Prevents circular delegation chains
- **Rate Limiting**: 60 second cooldown between voting actions
- **Organization Isolation**: Users can only interact within their organization
- **Audit Trails**: Complete logging of all voting and delegation actions
- **Data Backup**: Hourly Redis snapshots for disaster recovery
- **JWT Authentication**: Secure session management with token expiration
- **Input Validation**: Comprehensive validation on all user inputs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
