import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { LagoService, LagoCustomer, LagoSubscription, LagoUsageEvent } from './lago';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Lago service
const lagoApiKey = functions.config().lago?.api_key || process.env.LAGO_API_KEY;
const lagoApiUrl = functions.config().lago?.api_url || process.env.LAGO_API_URL || 'https://api.getlago.com/api/v1';

if (!lagoApiKey) {
  console.error('Lago API key not configured. Set it using: firebase functions:config:set lago.api_key="your_key"');
}

const lago = new LagoService(lagoApiKey, lagoApiUrl);

// Express app for API routes
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Lago setup (create billable metrics and plans)
app.post('/initialize', async (req, res) => {
  try {
    console.log('Initializing Lago setup...');

    // Create billable metrics
    const metrics = [
      {
        name: 'API Calls',
        code: 'api_calls',
        description: 'Number of API calls made',
        aggregation_type: 'count_agg' as const,
        field_name: 'count'
      },
      {
        name: 'Project Generations',
        code: 'project_generations',
        description: 'Number of projects generated',
        aggregation_type: 'count_agg' as const,
        field_name: 'count'
      },
      {
        name: 'Troubleshooting Sessions',
        code: 'troubleshooting_sessions',
        description: 'Number of troubleshooting sessions',
        aggregation_type: 'sum_agg' as const,
        field_name: 'duration'
      }
    ];

    for (const metric of metrics) {
      try {
        await lago.createBillableMetric(metric);
        console.log(`Created billable metric: ${metric.code}`);
      } catch (error: any) {
        if (error.response?.status !== 422) { // 422 means already exists
          throw error;
        }
        console.log(`Billable metric already exists: ${metric.code}`);
      }
    }

    // Create plans
    const plans = [
      {
        name: 'Learner Plan',
        code: 'learner',
        description: 'Basic plan for learners',
        interval: 'monthly' as const,
        amount_cents: 40000, // ₹400 in paise
        amount_currency: 'INR',
        trial_period: 7,
        charges: [
          {
            billable_metric_code: 'api_calls',
            charge_model: 'package' as const,
            properties: {
              amount: '0',
              free_units: 5,
              package_size: 5
            }
          }
        ]
      },
      {
        name: 'Pro Plan',
        code: 'pro',
        description: 'Professional plan with more features',
        interval: 'monthly' as const,
        amount_cents: 160000, // ₹1600 in paise
        amount_currency: 'INR',
        charges: [
          {
            billable_metric_code: 'api_calls',
            charge_model: 'package' as const,
            properties: {
              amount: '0',
              free_units: 25,
              package_size: 25
            }
          },
          {
            billable_metric_code: 'project_generations',
            charge_model: 'package' as const,
            properties: {
              amount: '0',
              free_units: 2,
              package_size: 2
            }
          }
        ]
      },
      {
        name: 'Pro+ Plan',
        code: 'pro_plus',
        description: 'Premium plan with all features',
        interval: 'monthly' as const,
        amount_cents: 480000, // ₹4800 in paise
        amount_currency: 'INR',
        charges: [
          {
            billable_metric_code: 'api_calls',
            charge_model: 'package' as const,
            properties: {
              amount: '0',
              free_units: 100,
              package_size: 100
            }
          },
          {
            billable_metric_code: 'project_generations',
            charge_model: 'package' as const,
            properties: {
              amount: '0',
              free_units: 5,
              package_size: 5
            }
          },
          {
            billable_metric_code: 'troubleshooting_sessions',
            charge_model: 'package' as const,
            properties: {
              amount: '0',
              free_units: 10,
              package_size: 10
            }
          }
        ]
      }
    ];

    for (const plan of plans) {
      try {
        await lago.createPlan(plan);
        console.log(`Created plan: ${plan.code}`);
      } catch (error: any) {
        if (error.response?.status !== 422) { // 422 means already exists
          throw error;
        }
        console.log(`Plan already exists: ${plan.code}`);
      }
    }

    res.json({ success: true, message: 'Lago setup initialized successfully' });
  } catch (error: any) {
    console.error('Error initializing Lago:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customer Management
app.post('/customers', async (req, res) => {
  try {
    const customerData: LagoCustomer = req.body;
    const customer = await lago.createCustomer(customerData);
    
    // Store customer info in Firestore
    await admin.firestore().collection('customers').doc(customerData.external_id).set({
      ...customerData,
      lago_customer_id: customer.customer.lago_id,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      subscription_tier: 'learner',
      trial_credits: 5
    });

    res.json(customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/customers/:id', async (req, res) => {
  try {
    const customer = await lago.getCustomer(req.params.id);
    res.json(customer);
  } catch (error: any) {
    console.error('Error getting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Subscription Management
app.post('/subscriptions', async (req, res) => {
  try {
    const subscriptionData: LagoSubscription = req.body;
    const subscription = await lago.createSubscription(subscriptionData);
    
    // Update customer subscription tier in Firestore
    await admin.firestore().collection('customers').doc(subscriptionData.external_customer_id).update({
      subscription_tier: subscriptionData.plan_code,
      subscription_id: subscription.subscription.lago_id,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json(subscription);
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/subscriptions', async (req, res) => {
  try {
    const { external_customer_id } = req.query;
    const subscriptions = await lago.getSubscriptions(external_customer_id as string);
    res.json(subscriptions);
  } catch (error: any) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Usage Tracking
app.post('/usage', async (req, res) => {
  try {
    const usageData: LagoUsageEvent = req.body;
    const result = await lago.trackUsage(usageData);
    
    // Update usage in Firestore for real-time tracking
    const customerRef = admin.firestore().collection('customers').doc(usageData.external_customer_id);
    const usageRef = customerRef.collection('usage').doc();
    
    await usageRef.set({
      code: usageData.code,
      properties: usageData.properties,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      transaction_id: usageData.transaction_id || usageRef.id
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/usage/:customerId', async (req, res) => {
  try {
    const usage = await lago.getCustomerUsage(req.params.customerId);
    res.json(usage);
  } catch (error: any) {
    console.error('Error getting usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invoice Management
app.get('/invoices', async (req, res) => {
  try {
    const { external_customer_id } = req.query;
    const invoices = await lago.getInvoices(external_customer_id as string);
    res.json(invoices);
  } catch (error: any) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Plans
app.get('/plans', async (req, res) => {
  try {
    const plans = await lago.getPlans();
    res.json(plans);
  } catch (error: any) {
    console.error('Error getting plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Received webhook:', event.webhook_type);

    switch (event.webhook_type) {
      case 'invoice.created':
        await handleInvoiceCreated(event);
        break;
      case 'invoice.payment_status_updated':
        await handlePaymentStatusUpdated(event);
        break;
      case 'subscription.started':
        await handleSubscriptionStarted(event);
        break;
      case 'subscription.terminated':
        await handleSubscriptionTerminated(event);
        break;
      default:
        console.log('Unhandled webhook type:', event.webhook_type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handlers
async function handleInvoiceCreated(event: any) {
  const invoice = event.invoice;
  console.log(`Invoice created for customer: ${invoice.customer.external_id}`);
  
  // Store invoice in Firestore
  await admin.firestore().collection('invoices').doc(invoice.lago_id).set({
    customer_id: invoice.customer.external_id,
    amount_cents: invoice.amount_cents,
    currency: invoice.currency,
    status: invoice.status,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handlePaymentStatusUpdated(event: any) {
  const invoice = event.invoice;
  console.log(`Payment status updated for invoice: ${invoice.lago_id} - Status: ${invoice.payment_status}`);
  
  // Update invoice status in Firestore
  await admin.firestore().collection('invoices').doc(invoice.lago_id).update({
    payment_status: invoice.payment_status,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handleSubscriptionStarted(event: any) {
  const subscription = event.subscription;
  console.log(`Subscription started for customer: ${subscription.customer.external_id}`);
  
  // Update customer subscription status
  await admin.firestore().collection('customers').doc(subscription.customer.external_id).update({
    subscription_status: 'active',
    subscription_started_at: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handleSubscriptionTerminated(event: any) {
  const subscription = event.subscription;
  console.log(`Subscription terminated for customer: ${subscription.customer.external_id}`);
  
  // Update customer subscription status
  await admin.firestore().collection('customers').doc(subscription.customer.external_id).update({
    subscription_status: 'terminated',
    subscription_terminated_at: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Export the API
export const api = functions.https.onRequest(app);

// Trigger function for new user registration
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    console.log('New user created:', user.uid);
    
    // Create customer in Lago
    const customerData: LagoCustomer = {
      external_id: user.uid,
      name: user.displayName || 'Anonymous User',
      email: user.email || '',
      currency: 'INR'
    };

    const customer = await lago.createCustomer(customerData);
    
    // Store customer info in Firestore
    await admin.firestore().collection('customers').doc(user.uid).set({
      ...customerData,
      lago_customer_id: customer.customer.lago_id,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      subscription_tier: 'learner',
      trial_credits: 5,
      subscription_status: 'trial'
    });

    console.log('Customer created in Lago and Firestore:', user.uid);
  } catch (error) {
    console.error('Error creating customer on user registration:', error);
  }
});
