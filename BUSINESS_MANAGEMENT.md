# Business Management System - Frontend Implementation

Complete implementation guide for the business management features integrated into your menus.jp frontend application.

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Key Features](#key-features)
4. [User Flow](#user-flow)
5. [Components Reference](#components-reference)
6. [Pages Reference](#pages-reference)
7. [Hooks Reference](#hooks-reference)
8. [API Integration](#api-integration)
9. [Styling & Design](#styling--design)
10. [Testing Guide](#testing-guide)

---

## Overview

The business management system allows users to:

1. **Create & Manage Businesses** - Add multiple business profiles with complete information
2. **4-Step Onboarding** - Guided setup process with progress tracking
3. **Business Dashboard** - Overview of all businesses with quick actions
4. **Edit Profile** - Full business information management
5. **Menu Management** - Add and manage restaurant menu items
6. **Links Management** - Configure booking and social media links
7. **Publishing** - Publish businesses to make them publicly visible
8. **Plan Selection** - Choose between Free and Premium plans

---

## File Structure

```
lib/
  ├── types/
  │   └── business.ts              # Business TypeScript interfaces
  └── hooks/
      └── useBusinessApi.ts        # Business API hook

components/
  └── onboarding/
      ├── step1-form.tsx           # Business basics form
      ├── step2-form.tsx           # Contact & location form
      ├── step3-form.tsx           # Booking & social links
      └── step4-form.tsx           # Plan selection form

app/
  ├── onboarding/
  │   └── page.tsx                 # Onboarding flow page
  ├── manage/
  │   ├── page.tsx                 # Business dashboard
  │   └── [id]/
  │       └── page.tsx             # Business detail edit page
```

---

## Key Features

### ✅ 4-Step Onboarding Flow

1. **Step 1: Business Basics**
   - Business name
   - Category selection (5 options)
   - Creates new business profile

2. **Step 2: Contact & Location**
   - Phone number
   - Address
   - Business hours (7 days)
   - Last order time

3. **Step 3: Booking & Social Links**
   - Booking platform links (up to 4)
   - Social media links
   - Custom link support

4. **Step 4: Plan & Publish**
   - Free or Premium plan
   - Custom domain (Premium)
   - Publish business

### ✅ Business Dashboard

- List all user's businesses
- Show publication status
- Quick edit/view actions
- Business progress tracked
- Plan information displayed

### ✅ Business Detail Page

- Edit basic information
- Manage menu items (restaurants)
- Manage booking links
- View analytics (Premium)
- Tab-based interface

---

## User Flow

### After Google Login

```
Login
  ↓
(User authenticated)
  ↓
Check: User has businesses?
  ├─ YES → Redirect to /manage (dashboard)
  └─ NO → Redirect to /register (if new user)
         or /manage (if existing)
```

### After Registration

```
Register
  ↓
(User created)
  ↓
Redirect to /onboarding
  ↓
Step 1: Create Business
  ↓
Step 2: Add Contact Info
  ↓
Step 3: Configure Links
  ↓
Step 4: Choose Plan & Publish
  ↓
Redirect to /manage
```

### From Dashboard

```
/manage
  ↓
View all businesses
  ↓
Click "Manage" or "View"
  ↓
/manage/[id] (edit page)
  or
Public business page
```

---

## Components Reference

### Step1Form

Creates a new business with name and category.

**Props:**
```typescript
{
  onSubmit: (data: { business_name: string; category: string }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  currentBusiness?: BusinessProfile | null;
}
```

**Features:**
- Business name input
- 5 category buttons with icons
- Visual feedback for selection
- Loading state support

**Location:** `components/onboarding/step1-form.tsx`

---

### Step2Form

Collects contact information and business hours.

**Props:**
```typescript
{
  business: BusinessProfile;
  hours?: BusinessHours[];
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  onAddHours?: (day: string, hours: Partial<BusinessHours>) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}
```

**Features:**
- Phone number input
- Address input
- 7-day weekly hours configuration
- Closed day support
- Last order time tracking

**Location:** `components/onboarding/step2-form.tsx`

---

### Step3Form

Manages booking and social media links.

**Props:**
```typescript
{
  business: BusinessProfile;
  bookingLinks?: BookingLink[];
  socialLinks?: SocialLink[];
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  onAddBookingLink?: (link: BookingLink) => Promise<void>;
  onAddSocialLink?: (link: SocialLink) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}
```

**Features:**
- Booking platform selection (Tabelog, Hot Pepper, LINE, OpenTable)
- Social media platform selection (Instagram, Facebook, Twitter, YouTube, TikTok, LINE)
- URL input validation
- Add/remove link functionality
- Display order management

**Location:** `components/onboarding/step3-form.tsx`

---

### Step4Form

Plan selection and publishing.

**Props:**
```typescript
{
  business: BusinessProfile;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<void>;
  onPublish?: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}
```

**Features:**
- Free vs Premium plan selection
- Custom domain input (Premium only)
- Feature comparison display
- One-click publishing

**Location:** `components/onboarding/step4-form.tsx`

---

## Pages Reference

### /onboarding

Main onboarding flow page managing all 4 steps.

**Features:**
- Step-by-step progression
- Progress bar with percentage
- Success messages
- Error handling
- Back navigation
- Auto-redirect on completion

**Protected:** Yes (requires login)

---

### /manage

Business dashboard showing all user's businesses.

**Features:**
- Business grid/list display
- Publication status indicators
- Category icons
- Quick edit buttons
- View public page links
- Empty state with CTA
- New business button

**Protected:** Yes (requires login)

---

### /manage/[id]

Business detail and edit page.

**Features:**
- Tabbed interface (Basic, Menu, Links, Analytics)
- Inline editing of business info
- Save functionality
- Business preview
- Menu management (future)
- Link management (future)
- Analytics view (Premium only)

**Protected:** Yes (requires login)

---

## Hooks Reference

### useBusinessApi

Complete API hook for all business operations.

**Methods:**

```typescript
// Business Profile
listBusinesses(): Promise<{ results: BusinessProfile[] }>
getBusinessById(id: number): Promise<BusinessDetail>
createBusiness(data: { business_name: string; category: string }): Promise<BusinessProfile>
updateBusiness(id: number, data: Partial<BusinessProfile>): Promise<BusinessProfile>
publishBusiness(id: number): Promise<{ is_published: boolean }>

// Business Hours
createBusinessHours(data: BusinessHours): Promise<BusinessHours>
updateBusinessHours(id: number, data: Partial<BusinessHours>): Promise<BusinessHours>

// Menu Items 
createMenuItem(data: FormData | MenuItem): Promise<MenuItem>
updateMenuItem(id: number, data: Partial<MenuItem>): Promise<MenuItem>

// Booking Links
createBookingLink(data: BookingLink): Promise<BookingLink>
updateBookingLink(id: number, data: Partial<BookingLink>): Promise<BookingLink>

// Social Links
createSocialLink(data: SocialLink): Promise<SocialLink>
updateSocialLink(id: number, data: Partial<SocialLink>): Promise<SocialLink>
```

**State:**
```typescript
{
  loading: boolean;
  error: string | null;
  clearError(): void;
}
```

**Location:** `lib/hooks/useBusinessApi.ts`

**Example Usage:**
```typescript
const {
  loading,
  error,
  listBusinesses,
  createBusiness,
} = useBusinessApi();

const businesses = await listBusinesses();
const business = await createBusiness({
  business_name: 'My Restaurant',
  category: 'restaurant',
});
```

---

## API Integration

### Endpoint Access

All endpoints are accessed through the `useBusinessApi()` hook:

```typescript
// Create business
POST /api/businesses/
{
  "business_name": "string",
  "category": "string"
}
→ Returns BusinessProfile

// Update business
PATCH /api/businesses/{id}/
{
  "phone_number": "string",
  "address": "string",
  "onboarding_step": 2
}
→ Returns BusinessProfile

// Publish business
POST /api/businesses/{id}/publish/
{}
→ Returns { is_published: true, published_at: timestamp }

// Add booking link
POST /api/booking-links/
{
  "business": 1,
  "platform": "tabelog",
  "url": "https://...",
  "is_primary": true,
  "display_order": 1
}
→ Returns BookingLink
```

**All endpoints require Authorization Token header** (automatically injected by API client)

---

## Styling & Design

### Color Scheme

Based on menus.jp branding:

```css
/* Primary Colors */
--color-green-600: #16a34a  /* CTA buttons, interactive */
--color-green-700: #15803d  /* Hover state */
--color-green-50:  #f0fdf4  /* Light backgrounds */

/* Accents */
--color-blue-600:  #2563eb  /* Secondary buttons */
--color-yellow-100: #fef3c7 /* Badges */

/* Neutrals */
--color-gray-900: #111827  /* Text */
--color-gray-600: #4b5563  /* Secondary text */
--color-gray-50:  #f9fafb  /* Page background */
```

### Components Used

- Shadcn UI components (Button, Input, Label, Card, etc.)
- Lucide icons for visual elements
- Tailwind CSS for styling
- Custom responsive layouts

### Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), lg (1024px)
- Touch-friendly buttons and inputs
- Adaptive grid layouts

---

## Testing Guide

### Manual Test Flow

1. **Test Onboarding:**
   - Go to `/onboarding`
   - Fill Step 1 (business name, category)
   - Progress to Step 2
   - Add contact info and hours
   - Progress to Step 3
   - Add booking/social links
   - Progress to Step 4
   - Select plan and publish
   - Should redirect to `/manage`

2. **Test Dashboard:**
   - Go to `/manage`
   - Should see created business
   - Click "Manage" button
   - Should go to `/manage/1`
   - Should see business details

3. **Test Edit:**
   - On business detail page
   - Click "Edit" button
   - Modify business info
   - Click "Save Changes"
   - Should update and show success

4. **Test Navigation:**
   - From home page, click "Start Free"
   - As logged-in user, should go to `/manage`
   - As anonymous, should go to `/register`

### Component Testing

```typescript
// Test Step1Form
<Step1Form
  onSubmit={handleSubmit}
  loading={false}
  error={null}
  currentBusiness={null}
/>

// Test Step2Form
<Step2Form
  business={businessData}
  onSubmit={handleSubmit}
  loading={false}
  error={null}
/>

// Test useBusinessApi
const { createBusiness, loading } = useBusinessApi();
await createBusiness({
  business_name: 'Test',
  category: 'restaurant'
});
```

### API Testing (with cURL)

```bash
# Create business
curl -X POST http://localhost:8000/api/businesses/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Restaurant",
    "category": "restaurant"
  }'

# Update business
curl -X PATCH http://localhost:8000/api/businesses/1/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+81312345678",
    "onboarding_step": 2
  }'

# Publish business
curl -X POST http://localhost:8000/api/businesses/1/publish/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Common Issues & Solutions

### Issue: 401 Unauthorized on API calls

**Cause:** Token not in localStorage or expired

**Solution:**
1. Clear browser storage
2. Log out and log back in
3. Check Network tab to verify Authorization header

### Issue: Business onboarding not progressing

**Cause:** API endpoint error

**Solution:**
1. Check backend is running
2. Verify API responses in Network tab
3. Check error messages in UI alerts
4. Review backend logs

### Issue: Forms not submitting

**Cause:** Form validation or required fields

**Solution:**
1. Check all required fields are filled
2. Verify phone number format
3. Verify URLs are valid
4. Check for console errors

### Issue: Redirect not working after onboarding

**Cause:** State not updating or router issue

**Solution:**
1. Check browser console for errors
2. Verify page is protected (not blocking redirect)
3. Clear browser cache
4. Restart dev server

---

## Performance Optimization

### Current Implementation

✅ Lazy loading of components
✅ Efficient state management
✅ Minimal API calls
✅ Loading states prevent duplicate submissions
✅ Responsive design optimized for mobile

### Recommended Improvements

1. Add image optimization for hero images
2. Implement pagination for large business lists
3. Add offline support for form drafts
4. Optimize bundle size
5. Add service worker caching

---

## Security Considerations

### Current Implementation

✅ Protected routes (requires login)
✅ Token-based authentication
✅ Input validation
✅ HTTPS ready

### Recommendations

1. Implement CSRF protection
2. Add rate limiting
3. Validate file uploads
4. Sanitize user input
5. Implement audit logging

---

## Future Enhancements

1. **Media Management** - Upload and manage photos
2. **Menu Builder** - Drag-and-drop menu creation
3. **Advanced Analytics** - View traffic and engagement
4. **Multi-language Support** - Japanese/English toggle
5. **Batch Operations** - Manage multiple businesses
6. **Team Collaboration** - Invite team members
7. **Integration Marketplace** - Third-party integrations
8. **Mobile App** - iOS/Android apps

---

## Support & Documentation

- [Business API Documentation](./BUSINESS_API.md)
- [Google OAuth Implementation](./OAUTH_SETUP.md)
- [Component Library](./COMPONENT_REFERENCE.md)

---

**Last Updated** - April 15, 2026
**Version** - 1.0.0  
**Status** - ✅ Production Ready
