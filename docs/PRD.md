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

## Issue Identified

The user encountered errors when trying to fetch subscriptions in the admin app:

- **React Error #130**: Minified React error in the browser
- **404 Not Found**: `GET http://localhost:3000/api/subscriptions 404 (Not Found)`
- **No backend requests**: Backend wasn't receiving any API calls

## Root Cause

The subscription pages were making API calls to the wrong endpoint:

- **Incorrect**: `http://localhost:3000/api/subscriptions` (Next.js frontend)
- **Correct**: `http://localhost:8000/api/v1/subscriptions` (FastAPI backend)

## Solutions Implemented

### 1. Created SubscriptionApi Utility

- **File**: `admin-app/lib/api/subscriptions.ts`
- **Purpose**: Centralized API service for subscription operations
- **Features**:
  - Uses proper backend URL (`${API_URL}/subscriptions/`)
  - Implements authentication headers via `fetchWithAuth`
  - Provides methods for: `getSubscriptions()`, `getSubscription()`, `createSubscription()`, `updateSubscription()`, `deleteSubscription()`
  - Includes TypeScript interfaces for type safety

### 2. Updated Subscription Pages to Use New API

#### Subscriptions List Page (`admin-app/app/subscriptions/page.tsx`)

- Replaced manual fetch calls with `SubscriptionApi.getSubscriptions()`
- Updated delete functionality to use `SubscriptionApi.deleteSubscription()`
- Removed local Subscription interface (now imported from API utility)

#### Create Subscription Page (`admin-app/app/subscriptions/create/page.tsx`)

- Replaced manual fetch with `SubscriptionApi.createSubscription()`
- **Fixed white-on-white text issue** by adding `text-gray-900 bg-white` to all form inputs
- Simplified form submission logic

#### Subscription Detail Page (`admin-app/app/subscriptions/[id]/page.tsx`)

- Updated to use `SubscriptionApi.getSubscription()`
- Removed local interface definition

#### Edit Subscription Page (`admin-app/app/subscriptions/[id]/edit/page.tsx`)

- **Already existed** and properly configured
- Uses `SubscriptionApi` for both fetching and updating
- Has proper styling with `text-gray-900 bg-white` for form visibility

## Additional Fixes

### Text Visibility Issue

- **Problem**: White text on white background in create subscription form
- **Solution**: Added explicit `text-gray-900 bg-white` classes to all input fields and textareas

### Missing Edit Page

- **Status**: Page already existed at correct location
- **Functionality**: Fully functional with proper API integration and form pre-population

## Technical Improvements

- **Consistent API patterns**: All subscription operations now follow the same pattern as other admin features (UserApi, etc.)
- **Type safety**: Proper TypeScript interfaces for all subscription data
- **Error handling**: Centralized error handling in API utility
- **Authentication**: Proper token-based auth for all API calls

## Result

✅ Subscription management is now fully functional:

- List subscriptions without 404 errors
- Create subscriptions with visible form inputs
- View individual subscription details
- Edit existing subscriptions
- Delete subscriptions with confirmation

The subscription functionality now properly communicates with the backend API at `localhost:8000` instead of trying to call non-existent frontend API routes.
