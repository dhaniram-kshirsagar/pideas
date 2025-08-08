# Lago Billing Example Project

A complete example project demonstrating Lago's billing and metering capabilities with Firebase hosting.

## Project Overview

This project demonstrates:
- Lago API integration for billing and metering
- Customer management
- Subscription plans (Learner, Pro, Pro+)
- Usage tracking and billing
- Webhooks handling
- Complete UI for subscription management

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase CLI**
3. **Lago Instance** (self-hosted or cloud)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Navigate to project directory
cd lago-example

# Install project dependencies
npm install
```

### 2. Lago Setup

#### Option A: Lago Cloud (Recommended for testing)
1. Sign up at [Lago Cloud](https://www.getlago.com/)
2. Get your API key from the dashboard
3. Note your Lago endpoint URL

#### Option B: Self-hosted Lago
1. Clone Lago repository:
```bash
git clone https://github.com/getlago/lago.git
cd lago
```

2. Start Lago with Docker:
```bash
# Copy environment file
cp .env.example .env

# Start Lago services
docker-compose up -d
```

3. Access Lago UI at `http://localhost:3000`

### 3. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore
```

### 4. Environment Configuration

Create `.env` file in functions directory:
```env
LAGO_API_KEY=your_lago_api_key
LAGO_API_URL=https://api.getlago.com/api/v1
# or http://localhost:3000/api/v1 for self-hosted
```

### 5. Deploy to Firebase

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

## Project Structure

```
lago-example/
├── public/
│   ├── index.html          # Main UI
│   ├── dashboard.html      # Subscription dashboard
│   ├── admin.html          # Admin panel
│   ├── css/
│   │   └── styles.css      # Styling
│   └── js/
│       ├── app.js          # Main application logic
│       ├── dashboard.js    # Dashboard functionality
│       └── admin.js        # Admin functionality
├── functions/
│   ├── src/
│   │   ├── index.ts        # Firebase functions
│   │   ├── lago.ts         # Lago API integration
│   │   └── webhooks.ts     # Webhook handlers
│   ├── package.json
│   └── .env
├── firebase.json
├── package.json
└── README.md
```

## Features Included

### 1. Customer Management
- Create customers in Lago
- Update customer information
- Delete customers

### 2. Subscription Plans
- **Learner Plan**: ₹400/month, 5 API calls
- **Pro Plan**: ₹1600/month, 25 API calls + 2 projects
- **Pro+ Plan**: ₹4800/month, 100 API calls + 5 projects + troubleshooting

### 3. Usage Tracking
- Track API calls
- Monitor usage limits
- Real-time usage updates

### 4. Billing & Invoicing
- Automatic invoice generation
- Payment processing
- Usage-based billing

### 5. Webhooks
- Invoice created
- Payment succeeded/failed
- Subscription updated

### 6. Admin Dashboard
- View all customers
- Manage subscriptions
- Monitor usage and billing

## API Endpoints

The Firebase Functions provide these endpoints:

```
POST /createCustomer      # Create new customer
GET /getCustomer/:id      # Get customer details
POST /createSubscription  # Create subscription
POST /trackUsage         # Track usage events
GET /getUsage/:id        # Get usage data
POST /webhook            # Handle Lago webhooks
```

## Usage Examples

### Create Customer
```javascript
const response = await fetch('/createCustomer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    external_id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com'
  })
});
```

### Track Usage
```javascript
await fetch('/trackUsage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    external_customer_id: 'user_123',
    code: 'api_calls',
    properties: { count: 1 }
  })
});
```

## Testing

1. **Create Test Customer**: Use the UI to create a test customer
2. **Subscribe to Plan**: Choose a subscription plan
3. **Track Usage**: Make API calls and see usage tracking
4. **View Invoices**: Check generated invoices in Lago dashboard
5. **Test Webhooks**: Trigger webhook events and verify handling

## Deployment Steps

1. **Build Functions**:
```bash
cd functions
npm run build
```

2. **Deploy to Firebase**:
```bash
firebase deploy --only functions,hosting
```

3. **Configure Lago Webhooks**:
   - In Lago dashboard, add webhook endpoint: `https://your-project.web.app/webhook`
   - Select events: invoice.created, payment_status.updated

## Monitoring

- **Firebase Console**: Monitor function logs and performance
- **Lago Dashboard**: Track billing, customers, and usage
- **Browser DevTools**: Debug frontend interactions

## Next Steps

After understanding this example:
1. Integrate similar patterns into your main Project Idea Generator
2. Customize billing metrics for your specific use cases
3. Implement your UI design patterns
4. Add your specific business logic

## Support

- [Lago Documentation](https://doc.getlago.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Lago GitHub Issues](https://github.com/getlago/lago/issues)
