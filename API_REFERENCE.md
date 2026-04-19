# API Reference - Quick Examples

Quick reference for implementing Google OAuth2 in your Next.js application.

## Table of Contents

- [Login](#login)
- [Register](#register)
- [Get Current User](#get-current-user)
- [Logout](#logout)
- [Protected Routes](#protected-routes)
- [Error Handling](#error-handling)

---

## Login

### Basic Login

```typescript
// pages/login.tsx
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return <LoginForm />;
}
```

### Custom Login with Hook

```typescript
import { useAuth } from '@/lib/hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

export function CustomLogin() {
  const { login, loading, error } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <GoogleLogin onSuccess={handleSuccess} />
    </div>
  );
}
```

### API Response

```typescript
{
  user: {
    id: 1,
    username: 'john_doe',
    email: 'john@gmail.com',
    first_name: 'John',
    last_name: 'Doe',
    google_id: '120987654321',
    profile_picture_url: 'https://...',
    is_google_authenticated: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  token: '9944b09cc5d6e8f11e85ef5e4c6a9e6c',
  session_id: 'kB8X-4qJ2pL9oR5sT3vW1xY8z',
  created: false,
  redirect_url: 'https://yourapp.com/dashboard'
}
```

---

## Register

### Basic Registration

```typescript
// pages/register.tsx
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

### Custom Register with Hook

```typescript
import { useAuth } from '@/lib/hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

export function CustomRegister() {
  const { register, loading, error } = useAuth();
  const [idToken, setIdToken] = useState(null);

  const handleGoogleSuccess = (credentialResponse) => {
    setIdToken(credentialResponse.credential);
  };

  const handleRegister = async () => {
    try {
      await register(idToken, {
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890'
      });
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div>
      {!idToken ? (
        <GoogleLogin onSuccess={handleGoogleSuccess} />
      ) : (
        <>
          <input placeholder="First Name" />
          <input placeholder="Last Name" />
          <button onClick={handleRegister}>Register</button>
        </>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}
```

### API Response

```typescript
{
  user: { /* same as login */ },
  registration: {
    id: 1,
    google_account_id: '987654321098',
    registration_email: 'jane@gmail.com',
    signup_flow: 'web',
    is_email_verified: true,
    profile_completion_status: 'incomplete',
    created_at: '2024-01-15T11:45:00Z',
    updated_at: '2024-01-15T11:45:00Z'
  },
  token: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  session_id: 'mN8X-9qJ2pL9oR5sT3vW1xY8z',
  redirect_url: 'https://yourapp.com/onboarding'
}
```

---

## Get Current User

### Using Auth Hook

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Name: {user.first_name} {user.last_name}</p>
      <p>Email: {user.email}</p>
      <img src={user.profile_picture_url} alt="Avatar" />
    </div>
  );
}
```

### API Request

```typescript
import apiClient from "@/lib/api/auth";

async function fetchCurrentUser() {
  try {
    const response = await apiClient.get("/users/me/");
    console.log(response.data); // User object
  } catch (error) {
    console.error("Failed to fetch user:", error);
  }
}
```

---

## Logout

### Using Auth Hook

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Redirect to home
    window.location.href = '/';
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### What Gets Cleared

```typescript
// Clears automatically
localStorage.removeItem("token");
localStorage.removeItem("user");
localStorage.removeItem("sessionId");

// Auth context updates
user = null;
token = null;
sessionId = null;
```

---

## Protected Routes

### Protecting a Page

```typescript
// app/dashboard/page.tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard content - only visible when logged in</div>
    </ProtectedRoute>
  );
}
```

### Protecting a Component

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function ProtectedComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return <div>Protected content</div>;
}
```

### Conditional Rendering

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.first_name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
```

---

## Error Handling

### Handle Login Errors

```typescript
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect } from 'react';

export function LoginWithErrorHandling() {
  const { login, error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      // Show error notification
      console.error('Auth error:', error);

      // Clear after 5 seconds
      const timeout = setTimeout(clearError, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);

  return (
    <div>
      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}
      {/* Login form here */}
    </div>
  );
}
```

### Error Codes

| Code                | Meaning                     | Solution                  |
| ------------------- | --------------------------- | ------------------------- |
| `INVALID_TOKEN`     | Token is invalid or expired | Re-authenticate           |
| `TOKEN_EXPIRED`     | Google token expired        | Log out and back in       |
| `USERNAME_TAKEN`    | Username already exists     | Choose different username |
| `VALIDATION_ERROR`  | Input validation failed     | Check form data           |
| `GOOGLE_AUTH_ERROR` | Google API error            | Check OAuth config        |

### API Error Handling

```typescript
import apiClient from "@/lib/api/auth";

async function makeRequest() {
  try {
    const response = await apiClient.get("/users/me/");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired
      console.error("Token expired");
      window.location.href = "/login";
    } else if (error.response?.status === 400) {
      // Validation error
      console.error("Validation error:", error.response.data.details);
    } else if (error.response?.status === 500) {
      // Server error
      console.error("Server error");
    } else {
      // Network error
      console.error("Network error:", error.message);
    }
  }
}
```

---

## Environment Variables

### Development

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_DEV_CLIENT_ID
NEXT_PUBLIC_API_BASE_URL=http://localhost:8005/api
```

### Production

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_PROD_CLIENT_ID
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Troubleshooting

### "Failed to get user info from Google"

- Check Google OAuth credentials
- Verify Google Identity API is enabled
- Check token is valid

### CORS errors

- Verify backend CORS configuration
- Check `CORS_ALLOWED_ORIGINS` includes frontend domain
- Verify API URL is correct

### "Token expired" loops

- Check backend token expiration settings
- Implement token refresh logic
- Check client and server clocks are synced

### Google button not rendering

- Check `GoogleOAuthProvider` wraps your app
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Check browser console for errors

---

## Best Practices

### ✅ DO

- Use `useAuth` hook for auth state
- Display loading states
- Handle errors gracefully
- Protect sensitive routes
- Store token securely (use httpOnly cookies in production)
- Log errors for debugging

### ❌ DON'T

- Store token in plain text
- Expose API endpoints to frontend
- Skip error handling
- Trust client-side validation alone
- Hardcode URLs
- Log sensitive information

---

## File Structure Reference

```
lib/
  ├── api/
  │   └── auth.ts              # API calls
  ├── hooks/
  │   └── useAuth.ts           # Auth hook
  └── types/
      └── auth.ts              # TypeScript types

components/
  ├── auth/
  │   ├── login-form.tsx       # Login UI
  │   ├── register-form.tsx    # Register UI
  │   └── protected-route.tsx  # Route protection
  └── providers/
      └── auth-provider.tsx    # Auth context

app/
  ├── login/page.tsx           # Login page
  ├── register/page.tsx        # Register page
  ├── dashboard/page.tsx       # Protected page
  └── layout.tsx               # Root layout
```

---

## More Information

- Full API documentation: [GOOGLE_OAUTH_DOCS.md](./GOOGLE_OAUTH_DOCS.md)
- Setup guide: [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- Integration guide: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

**Last Updated**: April 2026  
**Version**: 1.0
