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

### Database Schema

#### Core Tables
- `users` - User profiles with unique identifiers
- `organizations` - Organization management
- `proposals` - Proposal data with voting deadlines
- `proposal_options` - Voting options for each proposal
- `categories` - Expert categories for delegation guidance
- `category_followers` - User category subscriptions
- `category_suggestions` - Expert voting recommendations

#### Liquid Voting Tables
- `vote_audit` - Complete audit trail for all voting actions
- `delegation_resolution_audit` - Delegation chain resolution results
- `final_vote_results_audit` - Final vote counting with metadata
- `redis_snapshots` - Redis backup system for disaster recovery
- `vote_results` - Computed vote tallies per proposal option

#### Authentication
- `user_sessions` - JWT session management
- Foreign key constraints ensure data integrity

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
