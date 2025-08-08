import axios, { AxiosInstance } from 'axios';

export interface LagoCustomer {
  external_id: string;
  name: string;
  email: string;
  currency?: string;
  timezone?: string;
}

export interface LagoSubscription {
  external_customer_id: string;
  plan_code: string;
  name?: string;
  external_id?: string;
}

export interface LagoUsageEvent {
  external_customer_id: string;
  code: string;
  transaction_id?: string;
  properties: Record<string, any>;
  timestamp?: number;
}

export interface LagoPlan {
  name: string;
  code: string;
  description?: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  amount_cents: number;
  amount_currency: string;
  trial_period?: number;
  pay_in_advance?: boolean;
  bill_charges_monthly?: boolean;
  charges?: LagoCharge[];
}

export interface LagoCharge {
  billable_metric_code: string;
  charge_model: 'standard' | 'graduated' | 'package' | 'percentage';
  pay_in_advance?: boolean;
  invoiceable?: boolean;
  min_amount_cents?: number;
  properties?: Record<string, any>;
}

export interface LagoBillableMetric {
  name: string;
  code: string;
  description?: string;
  aggregation_type: 'count_agg' | 'sum_agg' | 'max_agg' | 'unique_count_agg';
  field_name?: string;
  weighted_interval?: 'seconds';
}

export class LagoService {
  private client: AxiosInstance;

  constructor(apiKey: string, baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Customer Management
  async createCustomer(customer: LagoCustomer) {
    try {
      const response = await this.client.post('/customers', { customer });
      return response.data;
    } catch (error: any) {
      console.error('Error creating customer:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCustomer(externalId: string) {
    try {
      const response = await this.client.get(`/customers/${externalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting customer:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateCustomer(externalId: string, customer: Partial<LagoCustomer>) {
    try {
      const response = await this.client.put(`/customers/${externalId}`, { customer });
      return response.data;
    } catch (error: any) {
      console.error('Error updating customer:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteCustomer(externalId: string) {
    try {
      const response = await this.client.delete(`/customers/${externalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting customer:', error.response?.data || error.message);
      throw error;
    }
  }

  // Billable Metrics Management
  async createBillableMetric(metric: LagoBillableMetric) {
    try {
      const response = await this.client.post('/billable_metrics', { billable_metric: metric });
      return response.data;
    } catch (error: any) {
      console.error('Error creating billable metric:', error.response?.data || error.message);
      throw error;
    }
  }

  async getBillableMetrics() {
    try {
      const response = await this.client.get('/billable_metrics');
      return response.data;
    } catch (error: any) {
      console.error('Error getting billable metrics:', error.response?.data || error.message);
      throw error;
    }
  }

  // Plan Management
  async createPlan(plan: LagoPlan) {
    try {
      const response = await this.client.post('/plans', { plan });
      return response.data;
    } catch (error: any) {
      console.error('Error creating plan:', error.response?.data || error.message);
      throw error;
    }
  }

  async getPlans() {
    try {
      const response = await this.client.get('/plans');
      return response.data;
    } catch (error: any) {
      console.error('Error getting plans:', error.response?.data || error.message);
      throw error;
    }
  }

  async getPlan(code: string) {
    try {
      const response = await this.client.get(`/plans/${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting plan:', error.response?.data || error.message);
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(subscription: LagoSubscription) {
    try {
      const response = await this.client.post('/subscriptions', { subscription });
      return response.data;
    } catch (error: any) {
      console.error('Error creating subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSubscriptions(externalCustomerId?: string) {
    try {
      const params = externalCustomerId ? { external_customer_id: externalCustomerId } : {};
      const response = await this.client.get('/subscriptions', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error getting subscriptions:', error.response?.data || error.message);
      throw error;
    }
  }

  async terminateSubscription(externalId: string) {
    try {
      const response = await this.client.delete(`/subscriptions/${externalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error terminating subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  // Usage Tracking
  async trackUsage(event: LagoUsageEvent) {
    try {
      const response = await this.client.post('/events', { event });
      return response.data;
    } catch (error: any) {
      console.error('Error tracking usage:', error.response?.data || error.message);
      throw error;
    }
  }

  async batchTrackUsage(events: LagoUsageEvent[]) {
    try {
      const response = await this.client.post('/events/batch', { events });
      return response.data;
    } catch (error: any) {
      console.error('Error batch tracking usage:', error.response?.data || error.message);
      throw error;
    }
  }

  // Usage Analytics
  async getCustomerUsage(externalCustomerId: string, subscriptionId?: string) {
    try {
      const params: any = { external_customer_id: externalCustomerId };
      if (subscriptionId) params.subscription_id = subscriptionId;
      
      const response = await this.client.get('/analytics/usage', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error getting customer usage:', error.response?.data || error.message);
      throw error;
    }
  }

  // Invoice Management
  async getInvoices(externalCustomerId?: string) {
    try {
      const params = externalCustomerId ? { external_customer_id: externalCustomerId } : {};
      const response = await this.client.get('/invoices', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error getting invoices:', error.response?.data || error.message);
      throw error;
    }
  }

  async getInvoice(id: string) {
    try {
      const response = await this.client.get(`/invoices/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting invoice:', error.response?.data || error.message);
      throw error;
    }
  }

  // Webhook signature verification
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}
