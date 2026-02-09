import axios from 'axios';

// Em produção: use VITE_API_URL (ex: https://bwatech.com.br/api) ou mesmo domínio (/api)
const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rotas que não devem enviar Authorization (evita 401 com token antigo)
const publicPaths = ['/users/register/', '/users/login/'];
const isPublic = (url: string) => publicPaths.some((p) => url?.includes(p));

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(
  (config) => {
    if (!isPublic(config.url ?? '')) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    // FormData: deixar o axios definir Content-Type com boundary (não usar application/json)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublic(error.config?.url ?? '')) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
