# Comprehensive Plan for Lago-Based Credit Metering

## **Current Project State Analysis**

### **Existing Architecture**
- **Frontend**: React TypeScript app with Firebase Auth integration
- **Backend**: Firebase Functions (TypeScript) with 8 core functions
- **Database**: Firestore for user data, history, and admin logs
- **AI Integration**: Gemini AI for project idea generation
- **Current Features**: Gamified profiling, idea generation, user history, admin management

### **Existing Functions to Meter**
1. `generateIdea` - Core project idea generation (already implemented)
2. `saveIdeaToHistory` - User history tracking (already implemented)
3. `gameStepsGet` - Gamification system (already implemented)
4. Admin functions - User/role management (already implemented)

## **Refined Service Categorization**

### **Service Mapping to Existing Functions**
1. **Project Idea Generation** → `generateIdea` function (✅ exists)
2. **Project Generation (GenAI)** → New function needed
3. **Troubleshooting/Deployment** → New function needed  
4. **Custom Project** → New function needed

### **Updated Tier Structure**

#### **Learner Tier ($0-5/month)**
- **Access**: Limited `generateIdea` calls (10-20/month)
- **Restrictions**: 
  - Hide `implementationGuide` sections
  - Limit `technicalRequirements` details
  - Remove `keyResources` and `commonChallenges`
  - Show only basic `projectStructure` phases
- **Credits**: 20 idea generations

#### **Pro Tier ($20/month)**
- **Access**: Full `generateIdea` + new project generation service
- **Features**: Complete project ideas + AI code generation
- **Credits**: 100 ideas + 10 project generations

#### **Pro+ Tier ($60/month)**
- **Access**: All services including troubleshooting and custom projects
- **Credits**: Unlimited ideas + 25 projects + 10 troubleshooting + 2 custom

## **Implementation Strategy**

### **Phase 1: Backend Extensions (New Functions)**
```typescript
// New Firebase Functions to add
export const generateProject = onCall() // Full project code generation
export const troubleshootProject = onCall() // Debug assistance
export const requestCustomProject = onCall() // Custom development
export const checkSubscription = onCall() // Lago integration
export const trackUsage = onCall() // Usage metering
```

### **Phase 2: Lago Integration Layer**
```typescript
// New services to integrate
interface LagoService {
  createCustomer(userId: string, email: string): Promise<string>
  trackEvent(customerId: string, eventType: string, metadata: any): Promise<void>
  checkUsageLimits(customerId: string, serviceType: string): Promise<boolean>
  getCurrentPlan(customerId: string): Promise<SubscriptionPlan>
}
```

### **Phase 3: Content Filtering System**
```typescript
// Modify existing generateIdea function
function filterContentByTier(idea: ProjectIdea, userTier: string): ProjectIdea {
  if (userTier === 'learner') {
    return {
      ...idea,
      implementationGuide: { gettingStarted: [], keyResources: [], commonChallenges: [] },
      technicalRequirements: { ...idea.technicalRequirements, skillsRequired: [] },
      // Add watermarks and upgrade prompts
    }
  }
  return idea;
}
```

### **Phase 4: Frontend Subscription Management**
```typescript
// New React components needed
- SubscriptionDashboard.tsx
- UsageTracker.tsx  
- PaywallModal.tsx
- PlanUpgradePrompt.tsx
- BillingHistory.tsx
```

## **Lago Configuration Details**

### **Billable Metrics Setup**
```yaml
idea_generation:
  code: "idea_gen"
  aggregation_type: "count_agg"
  field_name: "requests"

project_generation:
  code: "project_gen" 
  aggregation_type: "count_agg"
  field_name: "projects"

troubleshooting_session:
  code: "troubleshoot"
  aggregation_type: "sum_agg"
  field_name: "session_duration"

custom_project:
  code: "custom_proj"
  aggregation_type: "count_agg"
  field_name: "projects"
```

### **Plan Structure in Lago**
```yaml
learner_plan:
  interval: "monthly"
  charges:
    - billable_metric_code: "idea_gen"
      charge_model: "package"
      package_size: 20
      amount_cents: 0

pro_plan:
  interval: "monthly" 
  amount_cents: 2000
  charges:
    - billable_metric_code: "idea_gen"
      charge_model: "package" 
      package_size: 100
    - billable_metric_code: "project_gen"
      charge_model: "package"
      package_size: 10
```

## **Integration Points with Existing Code**

### **Modify Existing Functions**
1. **`generateIdea`**: Add usage tracking and content filtering
2. **`saveIdeaToHistory`**: Include subscription tier in saved data
3. **`getUserRole`**: Extend to include subscription status
4. **Frontend components**: Add subscription checks before API calls

### **Database Schema Extensions**
```typescript
// Extend existing Firestore collections
interface UserProfile {
  // ... existing fields
  lagoCustomerId?: string;
  subscriptionTier: 'learner' | 'pro' | 'pro+';
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  usageQuotas: {
    ideasRemaining: number;
    projectsRemaining: number;
    troubleshootingRemaining: number;
    customProjectsRemaining: number;
  };
}
```

## **User Experience Flow**

### **Onboarding**
1. User signs up → Auto-assigned to Learner tier
2. Lago customer created automatically
3. Trial credits provided (5-10 ideas)
4. Upgrade prompts after hitting limits

### **Usage Tracking**
1. Pre-request: Check tier and remaining credits
2. During request: Apply content filters based on tier
3. Post-request: Log usage event to Lago
4. Real-time: Update frontend usage indicators

### **Upgrade Journey**
1. Hit usage limits → Show upgrade modal
2. Stripe/payment integration → Lago webhook
3. Instant tier upgrade → Immediate access
4. Usage quotas reset monthly

## **Technical Implementation Priority**

### **High Priority**
1. Lago customer creation on user registration
2. Usage tracking middleware for existing `generateIdea`
3. Content filtering for Learner tier
4. Basic subscription status checking

### **Medium Priority**  
1. New service functions (project generation, troubleshooting)
2. Frontend subscription dashboard
3. Payment integration
4. Usage analytics

### **Low Priority**
1. Advanced billing features (proration, discounts)
2. Custom project workflow
3. Advanced analytics and reporting
4. Multi-currency support
