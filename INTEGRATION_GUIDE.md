# Google OAuth2 Integration Guide - Frontend

Complete integration guide for implementing Google OAuth2 in your Next.js application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Component Usage](#component-usage)
3. [Custom Integration](#custom-integration)
4. [API Integration](#api-integration)
5. [Error Handling](#error-handling)
6. [Testing & Debugging](#testing--debugging)
7. [Deployment](#deployment)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @react-oauth/google axios
```

### 2. Get Google OAuth Credentials

Visit [Google Cloud Console](https://console.cloud.google.com/) and follow these steps:

1. Create a new project (or use existing)
2. Enable Google Identity API
3. Go to **Credentials** → **Create OAuth 2.0 Client ID**
4. Select **Web application**
5. Add JavaScript origins: `http://localhost:3000`
6. Add redirect URIs: `http://localhost:3000/login`, `http://localhost:3000/register`
7. Copy your **Client ID**

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
NEXT_PUBLIC_API_BASE_URL=http://localhost:8005/api
```

### 4. Backend Configuration

Your Django backend needs these email settings:

```python
# settings.py
GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET')

ALLOWED_REDIRECT_URLS = [
    'http://localhost:3000/dashboard',
    'https://yourapp.com/dashboard',
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://yourapp.com',
]
```

### 5. Start Application

```bash
npm run dev
```

Visit `http://localhost:3000` and click Login/Sign Up.

---

## Component Usage

### LoginForm Component

Provides a complete login form with Google OAuth.

```jsx
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

**Features:**

- Google OAuth button
- Error display
- Auto-redirect on success
- Responsive design

### RegisterForm Component

Complete registration form with optional profile fields.

```jsx
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

**Features:**

- Google OAuth button
- Optional name and phone fields
- Error display
- Two-step flow (auth → profile)
- Responsive design

### ProtectedRoute Component

Protect routes that require authentication.

```jsx
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

**Behavior:**

- Shows loading spinner during auth check
- Redirects to `/login` if not authenticated
- Renders children if authenticated

---

## Custom Integration

### Using the Auth Hook

Access auth state from any component:

```jsx
import { useAuth } from "@/lib/hooks/useAuth";

export function MyComponent() {
  const { user, token, loading, error, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <p>Welcome, {user.first_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Custom Login Implementation

Create a custom login flow:

```jsx
import { useAuth } from "@/lib/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";

export function CustomLogin() {
  const { login, error } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      // User logged in successfully
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => alert("Login failed")}
      />
    </div>
  );
}
```

### Custom Register Implementation

Create a custom registration flow:

```jsx
import { useAuth } from "@/lib/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

export function CustomRegister() {
  const { register, error } = useAuth();
  const [idToken, setIdToken] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const handleGoogleSuccess = (credentialResponse) => {
    setIdToken(credentialResponse.credential);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(idToken, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
      });
      // Registration successful
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <form onSubmit={handleRegisterSubmit}>
      {!idToken ? (
        <GoogleLogin onSuccess={handleGoogleSuccess} />
      ) : (
        <>
          <input
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
          <input
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
          <button type="submit">Register</button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

## API Integration

### Making Authenticated Requests

The auth client automatically injects tokens:

```typescript
import apiClient from "@/lib/api/auth";

// GET request
const userData = await apiClient.get("/users/me/");

// POST request
const data = await apiClient.post("/users/me/update/", {
  first_name: "John",
  bio: "My bio",
});

// PUT request
await apiClient.put("/users/me/", {
  first_name: "Jane",
});

// DELETE request
await apiClient.delete("/users/me/avatar/");
```

### Using with Other Libraries

If you're using a different HTTP library, manually add the token:

```typescript
import axios from "axios";

const token = localStorage.getItem("token");

const response = await axios.get("/api/users/me/", {
  headers: {
    Authorization: `Token ${token}`,
  },
});
```

### Error Handling

Handle API errors consistently:

```typescript
import apiClient from "@/lib/api/auth";

try {
  const data = await apiClient.get("/users/me/");
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired
    window.location.href = "/login";
  } else if (error.response?.status === 400) {
    // Validation error
    console.error("Validation failed:", error.response.data);
  } else {
    // Network error
    console.error("Request failed:", error.message);
  }
}
```

---

## Error Handling

### Common Errors

| Error               | Cause                                | Solution                    |
| ------------------- | ------------------------------------ | --------------------------- |
| `INVALID_TOKEN`     | Token format or signature is invalid | Re-authenticate with Google |
| `TOKEN_EXPIRED`     | Google token has expired             | Log out and log back in     |
| `USERNAME_TAKEN`    | Username already exists              | Use different username      |
| `VALIDATION_ERROR`  | Form data failed validation          | Check input values          |
| `GOOGLE_AUTH_ERROR` | Google API error                     | Check Google OAuth config   |

### Handling Errors in Components

```jsx
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect } from "react";

export function ErrorHandler() {
  const { error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      // Show error alert
      alert(`Error: ${error}`);
      // Clear error after showing
      setTimeout(clearError, 3000);
    }
  }, [error, clearError]);

  return null;
}
```

### Global Error Boundary

Wrap your app with error boundary:

```jsx
"use client";

import { useState } from "react";

export function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);

  if (error) {
    return (
      <div className="error-container">
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>Try again</button>
      </div>
    );
  }

  return children;
}
```

---

## Testing & Debugging

### Enable Debug Logging

Add debug logging to track auth flow:

```typescript
// lib/hooks/useAuth.ts - Add logging

const login = useCallback(async (idToken: string) => {
  console.log("🔍 Login started", { idTokenLength: idToken.length });

  try {
    setLoading(true);
    console.log("📝 Sending login request...");

    const response = await authApi.login(idToken);

    console.log("✅ Login successful", {
      userId: response.user.id,
      sessionId: response.session_id,
    });

    // ... rest of logic
  } catch (err) {
    console.error("❌ Login failed:", err);
    throw err;
  }
}, []);
```

### Test with cURL

Test your backend API:

```bash
# Get a Google ID token (manually from browser console)
GOOGLE_ID_TOKEN="your_token_here"

# Test login endpoint
curl -X POST http://localhost:8005/api/auth/google-login/ \
  -H "Content-Type: application/json" \
  -d "{\"id_token\": \"$GOOGLE_ID_TOKEN\"}"

# Test register endpoint
curl -X POST http://localhost:8005/api/auth/google-register/ \
  -H "Content-Type: application/json" \
  -d "{
    \"id_token\": \"$GOOGLE_ID_TOKEN\",
    \"first_name\": \"John\",
    \"last_name\": \"Doe\"
  }"
```

### Browser DevTools

1. Open DevTools → Console
2. Check for OAuth loading:

   ```javascript
   // Check if Google library is loaded
   console.log(
     window.google !== undefined ? "✅ Google OAuth loaded" : "❌ Not loaded",
   );
   ```

3. Check token storage:

   ```javascript
   console.log(localStorage.getItem("token"));
   ```

4. Monitor requests in Network tab:
   - Look for `/api/auth/google-login/` requests
   - Check response headers for token
   - Monitor 401 responses (token expired)

### Common Issues

**Issue: "Google OAuth Client ID is not set"**

```javascript
// Check in console
console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

**Issue: CORS errors**

```javascript
// This means backend CORS is not configured
// Check backend settings.py for CORS_ALLOWED_ORIGINS
```

**Issue: "Failed to get user info from Google"**

- Verify Google OAuth credentials in backend
- Check Google Identity API is enabled
- Verify token is valid

---

## Deployment

### Environment Variables for Production

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

### Google Cloud Console Setup

1. Go to Credentials
2. Add authorized origins:

   ```
   https://yourdomain.com
   www.yourdomain.com
   ```

3. Add redirect URIs:
   ```
   https://yourdomain.com/login
   https://yourdomain.com/register
   https://yourdomain.com/dashboard
   ```

### Backend Configuration

```python
# settings.py - Production
ALLOWED_REDIRECT_URLS = [
    'https://yourdomain.com/dashboard',
    'https://www.yourdomain.com/dashboard',
]

CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
HTTPS_ONLY = True
```

### Deployment Checklist

- [ ] Google OAuth credentials obtained
- [ ] Environment variables configured
- [ ] Backend CORS configured for production domain
- [ ] Backend ALLOWED_REDIRECT_URLS updated
- [ ] SSL/HTTPS enabled
- [ ] Token storage strategy reviewed (localStorage vs cookies)
- [ ] Error logging configured
- [ ] Monitoring/alerting set up
- [ ] Load testing completed
- [ ] Security audit performed

---

## Performance Optimization

### Code Splitting

Status: ✅ Already implemented (Google OAuth loads dynamically)

### Token Refresh Strategy

Implement token refresh to keep users logged in:

```typescript
// lib/hooks/useAuth.ts

const refreshToken = useCallback(async () => {
  try {
    const response = await apiClient.post("/auth/refresh/", {
      // Send refresh token if available
    });

    localStorage.setItem("token", response.data.token);
    setToken(response.data.token);
  } catch (error) {
    logout();
  }
}, []);

// Check token validity periodically
useEffect(() => {
  const interval = setInterval(() => {
    const tokenExpiry = localStorage.getItem("token_expiry");
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      refreshToken();
    }
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, [refreshToken]);
```

---

## Additional Resources

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Package](https://www.npmjs.com/package/@react-oauth/google)
- [Next.js Documentation](https://nextjs.org/docs)
- [Axios Documentation](https://axios-http.com/)

---

**Last Updated**: April 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
