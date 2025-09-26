import apiClient from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  role: '排出事業者' | '元請' | '収集運搬' | '管理者';
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyName: string;
    mfaEnabled: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyName: string;
  mfaEnabled: boolean;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const { access_token, user } = response.data;
    
    // トークンをローカルストレージに保存
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', userData);
    const { access_token, user } = response.data;
    
    // トークンをローカルストレージに保存
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  async setupMfa(): Promise<{ secret: string; qrCodeUrl: string }> {
    const response = await apiClient.post('/auth/mfa/setup');
    return response.data;
  }

  async enableMfa(token: string): Promise<{ success: boolean }> {
    const response = await apiClient.post('/auth/mfa/enable', { token });
    return response.data;
  }

  async verifyMfa(token: string): Promise<{ isValid: boolean }> {
    const response = await apiClient.post('/auth/mfa/verify', { token });
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService();
