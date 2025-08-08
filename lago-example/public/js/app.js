// Firebase configuration - Replace with your actual config
const firebaseConfig = {
    // Add your Firebase config here
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global state
let currentUser = null;
let currentCustomer = null;
let currentUsage = {
    api_calls: { used: 0, limit: 5 },
    project_generations: { used: 0, limit: 0 },
    troubleshooting_sessions: { used: 0, limit: 0 }
};

// Authentication state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showAuthenticatedUI();
        loadCustomerData();
    } else {
        currentUser = null;
        showUnauthenticatedUI();
    }
});

// Authentication functions
async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }

    try {
        showMessage('Creating account...', 'info');
        const result = await auth.createUserWithEmailAndPassword(email, password);
        showMessage('Account created successfully!', 'success');
        
        // The onUserCreate function will automatically create the Lago customer
        setTimeout(() => {
            loadCustomerData();
        }, 2000);
        
    } catch (error) {
        console.error('Sign up error:', error);
        showMessage(error.message, 'error');
    }
}

async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }

    try {
        showMessage('Signing in...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Signed in successfully!', 'success');
    } catch (error) {
        console.error('Sign in error:', error);
        showMessage(error.message, 'error');
    }
}

async function signOut() {
    try {
        await auth.signOut();
        showMessage('Signed out successfully!', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        showMessage(error.message, 'error');
    }
}

// UI state management
function showAuthenticatedUI() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.email;
    
    // Show main sections
    document.getElementById('customer-section').style.display = 'block';
    document.getElementById('plans-section').style.display = 'block';
    document.getElementById('usage-section').style.display = 'block';
    document.getElementById('billing-section').style.display = 'block';
    document.getElementById('admin-section').style.display = 'block';
    document.querySelector('.navigation').style.display = 'flex';
    
    // Show customer section by default
    showSection('customer');
}

function showUnauthenticatedUI() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('login-form').style.display = 'flex';
    document.getElementById('user-info').style.display = 'none';
    
    // Hide main sections
    document.getElementById('customer-section').style.display = 'none';
    document.getElementById('plans-section').style.display = 'none';
    document.getElementById('usage-section').style.display = 'none';
    document.getElementById('billing-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'none';
    document.querySelector('.navigation').style.display = 'none';
}

function showSection(sectionName) {
    // Hide all sections
    const sections = ['customer', 'plans', 'usage', 'billing', 'admin'];
    sections.forEach(section => {
        document.getElementById(`${section}-section`).style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).style.display = 'block';
    
    // Update navigation
    document.querySelectorAll('.navigation button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'customer':
            loadCustomerData();
            break;
        case 'usage':
            loadUsageData();
            break;
        case 'billing':
            loadBillingData();
            break;
        case 'admin':
            loadAdminData();
            break;
    }
}

// Customer data management
async function loadCustomerData() {
    if (!currentUser) return;
    
    try {
        // Load from Firestore first
        const customerDoc = await db.collection('customers').doc(currentUser.uid).get();
        
        if (customerDoc.exists) {
            currentCustomer = customerDoc.data();
            displayCustomerInfo();
            loadSubscriptionInfo();
        } else {
            // Customer not found, might be newly created
            showMessage('Loading customer data...', 'info');
            setTimeout(loadCustomerData, 3000); // Retry after 3 seconds
        }
    } catch (error) {
        console.error('Error loading customer data:', error);
        showMessage('Error loading customer data', 'error');
    }
}

function displayCustomerInfo() {
    const customerDetails = document.getElementById('customer-details');
    if (!currentCustomer) {
        customerDetails.innerHTML = '<p>Loading customer information...</p>';
        return;
    }
    
    customerDetails.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Account Information</h4>
                <span class="badge ${getStatusBadgeClass(currentCustomer.subscription_status)}">
                    ${currentCustomer.subscription_status || 'trial'}
                </span>
            </div>
            <p><strong>Name:</strong> ${currentCustomer.name}</p>
            <p><strong>Email:</strong> ${currentCustomer.email}</p>
            <p><strong>Customer ID:</strong> ${currentCustomer.external_id}</p>
            <p><strong>Subscription Tier:</strong> ${currentCustomer.subscription_tier}</p>
            <p><strong>Trial Credits:</strong> ${currentCustomer.trial_credits || 0}</p>
            <p><strong>Created:</strong> ${formatDate(currentCustomer.created_at)}</p>
        </div>
    `;
}

async function loadSubscriptionInfo() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/subscriptions?external_customer_id=${currentUser.uid}`);
        const data = await response.json();
        
        const subscriptionInfo = document.getElementById('subscription-info');
        
        if (data.subscriptions && data.subscriptions.length > 0) {
            const subscription = data.subscriptions[0];
            subscriptionInfo.innerHTML = `
                <div class="card">
                    <p><strong>Plan:</strong> ${subscription.plan.name}</p>
                    <p><strong>Status:</strong> ${subscription.status}</p>
                    <p><strong>Started:</strong> ${formatDate(subscription.started_at)}</p>
                    <p><strong>Next Billing:</strong> ${formatDate(subscription.next_subscription_at)}</p>
                </div>
            `;
        } else {
            subscriptionInfo.innerHTML = `
                <div class="card">
                    <p>No active subscription. You're on the trial plan.</p>
                    <button onclick="showSection('plans')">Choose a Plan</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading subscription info:', error);
        document.getElementById('subscription-info').innerHTML = '<p>Error loading subscription information</p>';
    }
}

// Subscription management
async function subscribeToPlan(planCode) {
    if (!currentUser) {
        showMessage('Please sign in first', 'error');
        return;
    }
    
    try {
        showMessage(`Subscribing to ${planCode} plan...`, 'info');
        
        const response = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                external_customer_id: currentUser.uid,
                plan_code: planCode,
                name: `${planCode} subscription for ${currentUser.email}`
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Successfully subscribed!', 'success');
            
            // Update local customer data
            currentCustomer.subscription_tier = planCode;
            updateUsageLimits(planCode);
            
            // Refresh UI
            loadCustomerData();
            loadUsageData();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Subscription failed');
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showMessage(error.message, 'error');
    }
}

// Usage tracking
async function trackUsage(eventType, value = 1) {
    if (!currentUser) {
        showMessage('Please sign in first', 'error');
        return;
    }
    
    // Check if user has remaining usage
    const usage = currentUsage[eventType];
    if (usage && usage.used >= usage.limit) {
        showMessage(`You've reached your ${eventType.replace('_', ' ')} limit. Please upgrade your plan.`, 'warning');
        showSection('plans');
        return;
    }
    
    try {
        showMessage(`Tracking ${eventType}...`, 'info');
        
        const response = await fetch('/api/usage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                external_customer_id: currentUser.uid,
                code: eventType,
                transaction_id: `${eventType}_${Date.now()}`,
                properties: {
                    count: value,
                    timestamp: Date.now()
                }
            })
        });
        
        if (response.ok) {
            showMessage('Usage tracked successfully!', 'success');
            
            // Update local usage
            if (currentUsage[eventType]) {
                currentUsage[eventType].used += value;
            }
            
            updateUsageDisplay();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Usage tracking failed');
        }
    } catch (error) {
        console.error('Usage tracking error:', error);
        showMessage(error.message, 'error');
    }
}

async function loadUsageData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/usage/${currentUser.uid}`);
        if (response.ok) {
            const data = await response.json();
            // Process usage data and update display
            updateUsageDisplay();
        }
    } catch (error) {
        console.error('Error loading usage data:', error);
    }
}

function updateUsageLimits(planCode) {
    switch(planCode) {
        case 'learner':
            currentUsage = {
                api_calls: { used: currentUsage.api_calls.used, limit: 5 },
                project_generations: { used: currentUsage.project_generations.used, limit: 0 },
                troubleshooting_sessions: { used: currentUsage.troubleshooting_sessions.used, limit: 0 }
            };
            break;
        case 'pro':
            currentUsage = {
                api_calls: { used: currentUsage.api_calls.used, limit: 25 },
                project_generations: { used: currentUsage.project_generations.used, limit: 2 },
                troubleshooting_sessions: { used: currentUsage.troubleshooting_sessions.used, limit: 0 }
            };
            break;
        case 'pro_plus':
            currentUsage = {
                api_calls: { used: currentUsage.api_calls.used, limit: 100 },
                project_generations: { used: currentUsage.project_generations.used, limit: 5 },
                troubleshooting_sessions: { used: currentUsage.troubleshooting_sessions.used, limit: 10 }
            };
            break;
    }
    updateUsageDisplay();
}

function updateUsageDisplay() {
    // Update API calls
    const apiUsage = currentUsage.api_calls;
    const apiPercentage = (apiUsage.used / apiUsage.limit) * 100;
    document.getElementById('api-usage-bar').style.width = `${Math.min(apiPercentage, 100)}%`;
    document.getElementById('api-usage-text').textContent = `${apiUsage.used}/${apiUsage.limit} used`;
    
    // Update project generations
    const projectUsage = currentUsage.project_generations;
    const projectPercentage = projectUsage.limit > 0 ? (projectUsage.used / projectUsage.limit) * 100 : 0;
    document.getElementById('project-usage-bar').style.width = `${Math.min(projectPercentage, 100)}%`;
    document.getElementById('project-usage-text').textContent = `${projectUsage.used}/${projectUsage.limit} used`;
    
    // Update troubleshooting
    const troubleshootUsage = currentUsage.troubleshooting_sessions;
    const troubleshootPercentage = troubleshootUsage.limit > 0 ? (troubleshootUsage.used / troubleshootUsage.limit) * 100 : 0;
    document.getElementById('troubleshoot-usage-bar').style.width = `${Math.min(troubleshootPercentage, 100)}%`;
    document.getElementById('troubleshoot-usage-text').textContent = `${troubleshootUsage.used}/${troubleshootUsage.limit} used`;
    
    // Update bar colors based on usage
    updateUsageBarColors();
}

function updateUsageBarColors() {
    const bars = [
        { element: document.getElementById('api-usage-bar'), usage: currentUsage.api_calls },
        { element: document.getElementById('project-usage-bar'), usage: currentUsage.project_generations },
        { element: document.getElementById('troubleshoot-usage-bar'), usage: currentUsage.troubleshooting_sessions }
    ];
    
    bars.forEach(({ element, usage }) => {
        const percentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
        element.className = 'usage-fill';
        
        if (percentage >= 90) {
            element.classList.add('danger');
        } else if (percentage >= 70) {
            element.classList.add('warning');
        }
    });
}

// Billing data
async function loadBillingData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/invoices?external_customer_id=${currentUser.uid}`);
        if (response.ok) {
            const data = await response.json();
            displayBillingData(data);
        }
    } catch (error) {
        console.error('Error loading billing data:', error);
        showMessage('Error loading billing data', 'error');
    }
}

function displayBillingData(data) {
    const summaryContent = document.getElementById('billing-summary-content');
    const invoicesContent = document.getElementById('invoices-content');
    
    // Display billing summary
    summaryContent.innerHTML = `
        <div class="card">
            <p><strong>Current Plan:</strong> ${currentCustomer?.subscription_tier || 'Trial'}</p>
            <p><strong>Status:</strong> ${currentCustomer?.subscription_status || 'Active'}</p>
            <p><strong>Next Billing:</strong> ${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</p>
        </div>
    `;
    
    // Display invoices
    if (data.invoices && data.invoices.length > 0) {
        const invoicesHtml = data.invoices.map(invoice => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Invoice #${invoice.number}</span>
                    <span class="badge ${getStatusBadgeClass(invoice.status)}">${invoice.status}</span>
                </div>
                <p><strong>Amount:</strong> ₹${(invoice.amount_cents / 100).toFixed(2)}</p>
                <p><strong>Date:</strong> ${formatDate(invoice.created_at)}</p>
            </div>
        `).join('');
        
        invoicesContent.innerHTML = invoicesHtml;
    } else {
        invoicesContent.innerHTML = '<div class="card"><p>No invoices yet</p></div>';
    }
}

// Admin functions
async function initializeLago() {
    try {
        showMessage('Initializing Lago setup...', 'info');
        
        const response = await fetch('/api/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Lago initialized successfully!', 'success');
            loadAdminData();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Initialization failed');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showMessage(error.message, 'error');
    }
}

async function loadAllCustomers() {
    try {
        showMessage('Loading customers...', 'info');
        
        const snapshot = await db.collection('customers').get();
        const customers = [];
        
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminData('customers', customers);
        showMessage(`Loaded ${customers.length} customers`, 'success');
    } catch (error) {
        console.error('Error loading customers:', error);
        showMessage('Error loading customers', 'error');
    }
}

async function loadAllPlans() {
    try {
        showMessage('Loading plans...', 'info');
        
        const response = await fetch('/api/plans');
        if (response.ok) {
            const data = await response.json();
            displayAdminData('plans', data.plans || []);
            showMessage(`Loaded ${data.plans?.length || 0} plans`, 'success');
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        showMessage('Error loading plans', 'error');
    }
}

function loadAdminData() {
    const adminLogs = document.getElementById('admin-logs');
    adminLogs.innerHTML = '<p>Admin dashboard loaded. Use the buttons above to load data.</p>';
}

function displayAdminData(type, data) {
    const adminLogs = document.getElementById('admin-logs');
    
    if (type === 'customers') {
        const customersHtml = data.map(customer => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${customer.name}</span>
                    <span class="badge ${getStatusBadgeClass(customer.subscription_status)}">${customer.subscription_tier}</span>
                </div>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Created:</strong> ${formatDate(customer.created_at)}</p>
                <p><strong>Trial Credits:</strong> ${customer.trial_credits || 0}</p>
            </div>
        `).join('');
        
        adminLogs.innerHTML = `<h4>Customers (${data.length})</h4>${customersHtml}`;
    } else if (type === 'plans') {
        const plansHtml = data.map(plan => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${plan.name}</span>
                    <span class="badge success">₹${(plan.amount_cents / 100).toFixed(2)}</span>
                </div>
                <p><strong>Code:</strong> ${plan.code}</p>
                <p><strong>Interval:</strong> ${plan.interval}</p>
                <p><strong>Charges:</strong> ${plan.charges?.length || 0}</p>
            </div>
        `).join('');
        
        adminLogs.innerHTML = `<h4>Plans (${data.length})</h4>${plansHtml}`;
    }
}

// Utility functions
function showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('status-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.textContent = message;
    
    messagesContainer.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 5000);
}

function formatDate(date) {
    if (!date) return 'N/A';
    
    if (date.toDate) {
        // Firestore timestamp
        date = date.toDate();
    } else if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case 'active':
        case 'paid':
        case 'success':
            return 'success';
        case 'trial':
        case 'pending':
        case 'warning':
            return 'warning';
        case 'inactive':
        case 'failed':
        case 'terminated':
            return 'danger';
        default:
            return 'success';
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Lago Billing Example App initialized');
    
    // Set up initial usage limits for trial
    updateUsageLimits('learner');
});
