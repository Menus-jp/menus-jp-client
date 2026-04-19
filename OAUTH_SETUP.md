# Google OAuth2 Frontend Implementation

Complete frontend integration for Google OAuth2 authentication in your Next.js client application for menus.jp.

## 📦 What's Included

This implementation provides a complete, production-ready Google OAuth2 authentication system with the following components:

### Core Files

- **Auth Provider** (`components/providers/auth-provider.tsx`) - Global authentication state management
- **API Client** (`lib/api/auth.ts`) - Axios-based API communication with automatic token injection
- **Auth Hook** (`lib/hooks/useAuth.ts`) - React hook for accessing auth context
- **Type Definitions** (`lib/types/auth.ts`) - TypeScript interfaces for all auth objects

### UI Components

- **Login Form** (`components/auth/login-form.tsx`) - Google OAuth signin button
- **Register Form** (`components/auth/register-form.tsx`) - Google OAuth signup with optional profile fields
- **Protected Route** (`components/auth/protected-route.tsx`) - Route protection wrapper

### Pages

- **Login Page** (`app/login/page.tsx`) - Standalone login page
- **Register Page** (`app/register/page.tsx`) - Standalone signup page
- **Dashboard Page** (`app/dashboard/page.tsx`) - User profile dashboard (protected)
- **Home Page** (`app/page.tsx`) - Updated landing page with auth support

## 🚀 Quick Start

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Identity API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   ```
   http://localhost:3000
   YOUR_PRODUCTION_DOMAIN
   ```
7. Add authorized redirect URIs:
   ```
   http://localhost:3000/login
   http://localhost:3000/register
   YOUR_PRODUCTION_DOMAIN/login
   YOUR_PRODUCTION_DOMAIN/register
   ```
8. Copy your **Client ID**

### 2. Configure Environment Variables

Update `.env.local` with your Google Client ID:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
NEXT_PUBLIC_API_BASE_URL=http://localhost:8005/api
```

**Note**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Never expose secret keys here.

### 3. Update Backend API Configuration

In your Django backend `.env` file:

```env
GOOGLE_OAUTH2_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_OAUTH2_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE

# Allowed redirect URLs (comma-separated)
ALLOWED_REDIRECT_URLS=http://localhost:3000/dashboard,YOUR_PRODUCTION_DOMAIN/dashboard

# CORS configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,YOUR_PRODUCTION_DOMAIN
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📋 Features

### ✅ Authentication Flow

1. **Login (`/login`)**
   - Google OAuth button
   - Automatic account detection (existing user)
   - Redirect to dashboard on success
   - Error handling and display

2. **Register (`/register`)**
   - Google OAuth button
   - Optional profile fields (first name, last name, phone)
   - Auto-generates username if not provided
   - Redirect to onboarding/dashboard on success
   - Error handling and display

3. **Dashboard (`/dashboard`)**
   - Protected route (redirects to login if not authenticated)
   - Display user profile information
   - Show Google OAuth verification status
   - Logout functionality
   - Integration instructions for API usage

### ✅ State Management

- Global authentication state via React Context
- Persistent token storage in localStorage
- Automatic token injection in API requests
- Token expiration detection and automatic logout
- Loading and error states

### ✅ API Communication

- Automatic token injection in `Authorization` header
- Error handling with retry-able failures
- Type-safe request/response handling
- CORS support
- Network error handling

### ✅ Security Features

- Token stored in localStorage (production should use httpOnly cookies)
- Automatic logout on token expiration (401 responses)
- Protected routes with auth checks
- Secure API communication with token headers
- CORS protection

## 🔑 Environment Variables

| Variable                       | Type   | Required | Description                                              |
| ------------------------------ | ------ | -------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | string | ✅ Yes   | Google OAuth Client ID from Google Cloud Console         |
| `NEXT_PUBLIC_API_BASE_URL`     | string | ✅ Yes   | Backend API base URL (e.g., `http://localhost:8005/api`) |

## 🛠️ Usage Examples

### Using the Auth Hook

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function MyComponent() {
  const { user, token, loading, error, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user.first_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>This page is protected!</div>
    </ProtectedRoute>
  );
}
```

### Making Authenticated API Calls

```typescript
import apiClient from "@/lib/api/auth";

async function fetchUserData() {
  try {
    const response = await apiClient.get("/api/users/profile/");
    console.log(response.data);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }
}
```

## 📱 Component Reference

### AuthProvider

Wraps the application and provides auth context.

```typescript
<AuthProvider>
  <YourApp />
</AuthProvider>
```

**Context Value:**

- `user: User | null` - Current authenticated user
- `token: string | null` - API authentication token
- `sessionId: string | null` - Session identifier
- `loading: boolean` - Auth state loading flag
- `error: string | null` - Error message
- `login(idToken, accessToken?, redirectUrl?)` - Login function
- `register(idToken, userData?)` - Register function
- `logout()` - Logout function
- `clearError()` - Clear error message

### LoginForm

Google OAuth login component.

**Features:**

- Google sign-in button
- Error display
- Auto-redirect on success
- Loading states

### RegisterForm

Google OAuth registration component.

**Features:**

- Google sign-in button
- Optional profile fields (first/last name, phone)
- Two-step flow: authenticate then optionally add profile info
- Error display
- Loading states

### ProtectedRoute

Route protection wrapper.

**Usage:**

```typescript
<ProtectedRoute>
  <ProtectedContent />
</ProtectedRoute>
```

**Behavior:**

- Shows loading spinner while auth state initializes
- Redirects to `/login` if user is not authenticated
- Renders children if authenticated

## 🔄 Authentication Flow Diagram

```
User
  │
  ├─→ Clicks "Sign in with Google"
  │     │
  │     └─→ Google OAuth Dialog
  │           │
  │           └─→ User authorizes
  │                 │
  │                 └─→ Google returns ID Token
  │
  ├─→ LoginForm sends ID Token to backend
  │     │
  │     └─→ POST /api/auth/google-login/
  │           │
  │           └─→ Backend verifies token with Google
  │                 │
  │                 └─→ Backend creates/updates user
  │                       │
  │                       └─→ Returns user + token
  │
  └─→ Frontend stores token & user
        │
        └─→ AuthProvider updates state
              │
              └─→ Redirect to /dashboard
```

## 📝 API Response Types

### LoginResponse

```typescript
{
  user: User; // User profile
  token: string; // API auth token
  created: boolean; // false = existing user
  redirect_url: string; // URL to redirect to
  session_id: string; // Session identifier
}
```

### RegisterResponse

```typescript
{
  user: User;           // New user profile
  registration: {...};  // Registration metadata
  token: string;        // API auth token
  redirect_url: string; // URL to redirect to
  session_id: string;   // Session identifier
}
```

## 🚨 Error Handling

All errors follow a consistent format:

```typescript
{
  error: "ERROR_CODE"; // Machine-readable error code
  message: "Error message"; // User-friendly message
  details: "Additional..."; // Debug information
}
```

Common errors:

- `INVALID_TOKEN` - Token verification failed
- `TOKEN_EXPIRED` - Token has expired
- `USERNAME_TAKEN` - Username already exists
- `VALIDATION_ERROR` - Input validation failed
- `GOOGLE_AUTH_ERROR` - Google API error

## 🔒 Security Considerations

### Current Implementation

- ✅ HTTPS-ready
- ✅ Token stored in localStorage
- ✅ Automatic token injection
- ✅ Token expiration detection
- ✅ CORS support

### Production Recommendations

1. **Use httpOnly Cookies** instead of localStorage

   ```typescript
   // Backend should set:
   // Set-Cookie: token=value; HttpOnly; Secure; SameSite=Strict
   ```

2. **Implement CSRF Protection**
   - Use CSRF tokens for state-changing requests

3. **Token Refresh Strategy**
   - Implement refresh token rotation
   - Use refresh tokens for token expiration

4. **Rate Limiting**
   - Implement login attempt rate limiting
   - Implement registration rate limiting

5. **Monitor for Suspicious Activity**
   - Log failed login attempts
   - Alert on unusual access patterns

## 🐛 Troubleshooting

### "Google OAuth Client ID is not set"

Check `.env.local` has `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set correctly.

### "401 Unauthorized" errors

Token may have expired. Try logging out and logging back in.

### CORS errors

Check backend CORS configuration includes `http://localhost:3000` (development) or your production domain.

### "Failed to get user info from Google"

Verify Google OAuth credentials are correct and Google Identity API is enabled.

### Google sign-in button not appearing

Check that `GoogleOAuthProvider` wraps your app in `app/layout.tsx`.

## 📚 Additional Resources

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [React OAuth Library](https://www.npmjs.com/package/@react-oauth/google)
- [API Documentation](./API_DOCS.md)

## 📄 File Structure

```
lib/
  ├── api/
  │   └── auth.ts              # API client with auth endpoints
  ├── hooks/
  │   └── useAuth.ts           # useAuth hook
  └── types/
      └── auth.ts              # TypeScript types

components/
  ├── auth/
  │   ├── login-form.tsx       # Login component
  │   ├── register-form.tsx    # Register component
  │   └── protected-route.tsx  # Route protection wrapper
  └── providers/
      └── auth-provider.tsx    # Auth context provider

app/
  ├── login/
  │   └── page.tsx             # Login page
  ├── register/
  │   └── page.tsx             # Register page
  ├── dashboard/
  │   └── page.tsx             # Protected dashboard
  ├── layout.tsx               # Root layout with providers
  ├── page.tsx                 # Home page
  └── globals.css              # Global styles

.env.local                      # Environment variables
```

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section
2. Review the [API Documentation](../GOOGLE_OAUTH_DOCS.md)
3. Check browser console for specific error messages
4. Verify backend is running on correct port

---

**Last Updated**: April 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
