# Green Energy Trading Marketplace

A comprehensive platform for green energy trading that connects buyers and sellers while providing real-time market data and news. The system enables trading of various green energy assets including EUAs, EUA2, GOO, GEO, voluntary markets, and biofuels.

## Applications

### 1. Landing Page

- Modern, responsive marketing site
- Built with Next.js
- Key features:
  - Subscription information
  - Product descriptions
  - User registration and login
  - Benefits of using the platform

### 2. Marketplace Application

- Core trading platform for users
- Built with Next.js and WebSockets for real-time updates
- Key features:
  - Live news feed for green energy industry
  - Real-time market prices
  - Buy/sell order placement
  - Order matching system
  - User dashboard with transaction history
  - KYC verification for EU asset trading
  - Subscription management

### 3. Admin Application

- Management dashboard for platform administrators
- Built with Next.js
- Key features:
  - User management
  - Content management for news
  - Transaction monitoring
  - KYC verification management
  - System configuration
  - Analytics and reporting

## Technical Stack

### Frontend

- Next.js for all applications
- React Context API for state management
- WebSockets for real-time updates
- Responsive design for all device types

### Backend

- FastAPI (Python) for all services
- JWT authentication
- PostgreSQL database
- Redis for caching and pub/sub
- WebSockets for real-time communication

### Infrastructure

- Digital Ocean for hosting all applications
- CI/CD via GitHub Actions
- Maximum capacity for 100 concurrent users

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL
- Redis

### Running the Landing Page

```bash
cd landing-page
npm install
npm run dev
```

The landing page will be available at http://localhost:3000

### Running the Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The API will be available at http://localhost:8000

## Development Progress

- Sprint 1: Setting up project structure and basic functionality

## Data Sources

- External API integrations for real-time market data
- News API services for industry headlines
- KYC verification services

## Next Steps

1. Continue development with 1-week sprints
2. Deploy MVP to Digital Ocean
3. Test with initial users
4. Scale based on feedback

## Contact

For any questions regarding this project, please contact the project manager.
