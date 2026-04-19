export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  google_id: string;
  google_email: string;
  profile_picture_url: string | null;
  phone_number: string | null;
  bio: string | null;
  is_google_authenticated: boolean;
  google_auth_token: {
    user_id: number;
    is_token_expired: boolean;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GoogleAuthToken {
  user_id: number;
  is_token_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  created: boolean;
  redirect_url: string | null;
  session_id: string;
}

export interface RegisterResponse {
  user: User;
  registration: {
    id: number;
    google_account_id: string;
    registration_email: string;
    locale: string;
    signup_flow: string;
    is_email_verified: boolean;
    second_factor_enabled: boolean;
    profile_completion_status: "incomplete" | "partial" | "complete";
    created_at: string;
    updated_at: string;
  };
  token: string;
  redirect_url: string | null;
  session_id: string;
}

export interface AuthError {
  error: string;
  message: string;
  details: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (
    idToken: string,
    accessToken?: string,
    redirectUrl?: string,
  ) => Promise<void>;
  register: (
    idToken: string,
    userData?: {
      username?: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      access_token?: string;
    },
  ) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
