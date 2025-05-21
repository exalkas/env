# Product Requirements Document: Green Energy Trading Marketplace

## Overview

A marketplace platform for green energy trading and information that enables users to buy, sell, and access real-time news about green energy markets.

## User Roles

- **Trial Users**: Users with 7-day trial subscription
- **Standard Users**: Paying subscribers with full access
- **Administrators**: Staff who manage the platform

## Product Features

### Authentication & Authorization

- User registration and login
- KYC verification (only required for EU asset trading, not for registration)
- Role-based access control
- Password reset functionality
- Session management

### Subscription Management

- 7-day trial subscription
  - Access to news viewing
  - View-only access to marketplace offers
- Standard subscription
  - Full access to live news
  - Ability to place buy/sell orders
  - Access to current market prices

### News Section

- Headline news feed for green energy industry
- Category filters (EUAs, EUA2, GOO, GEO, voluntary markets, biofuels)
- Real-time news updates for standard subscribers
- Basic news viewing for trial users

### Marketplace

- Live price tracking for all green energy products
- Buy/sell order placement interface
- Order matching system
- Current offers display
- Automated offer creation based on current EUA prices
- Support for max 100 concurrent users

### Admin Dashboard

- User management
- Content management for news
- Transaction monitoring
- Notification settings
- Analytics and reports
- KYC verification management

### Notifications

- Admin notifications (email, SMS, and in-app)
- User notifications for order matching, price alerts
- System notifications for important events

## User Flows

### Registration & Onboarding

1. User registers with email/password
2. Email verification
3. User selects subscription type (trial/standard)
4. Platform tour/walkthrough
5. Optional KYC verification (required only for EU asset trading)

### Trading Flow

1. User navigates to marketplace
2. Views current offers and prices
3. Selects product to buy/sell
4. If EU asset and not KYC verified, prompted for verification
5. Enters quantity and price
6. Reviews and confirms order
7. Receives notification when order is matched

## Technical Requirements

- Responsive design for all device types
- Real-time data updates
- Secure payment processing
- API integrations for market data providers
- Scalable backend architecture
- Support for maximum 100 concurrent users

## Non-functional Requirements

- Page load time < 2 seconds
- 99.9% system uptime
- Compliance with financial regulations
- GDPR compliance

## Platform Components

1. Landing Page (Marketing Site)
2. Main Application (News + Marketplace)
3. Admin Panel
4. API Services Layer
