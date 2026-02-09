import api from './api';

export type User = {
  id: string; // UUID
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  profile_picture_url?: string | null;
  date_joined: string;
}

export type LoginData = {
  username: string;
  password: string;
}

export type RegisterData = {
  first_name: string;
  username: string;
  email: string;
  password: string;
  profile_picture?: File | null;
}

export type LoginResponse = {
  user: User;
  token: string;
  message: string;
}

export const authService = {
  async register(data: RegisterData): Promise<LoginResponse> {
    if (data.profile_picture) {
      const formData = new FormData();
      formData.append('first_name', data.first_name);
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('profile_picture', data.profile_picture, data.profile_picture.name);
      const response = await api.post('/users/register/', formData);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    }
    const response = await api.post('/users/register/', {
      first_name: data.first_name,
      username: data.username,
      email: data.email,
      password: data.password,
    });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post('/users/login/', data);
    // Salva o token no localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/users/logout/');
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me/');
    return response.data;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/users/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async uploadProfilePicture(file: Blob): Promise<User> {
    const formData = new FormData();
    formData.append('profile_picture', file, 'profile.png');
    const response = await api.post<User>('/users/profile-picture/', formData);
    return response.data;
  },
};
