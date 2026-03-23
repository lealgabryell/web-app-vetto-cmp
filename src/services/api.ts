import axios from 'axios';
import Cookie from 'js-cookie';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: 'https://hml-api-tratti-arq.onrender.com',
});

// Interceptor para adicionar o Token em todas as chamadas
api.interceptors.request.use((config) => {
  const token = Cookie.get('user_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar token expirado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error ?? error.response?.data;

    if (status === 401 && errorMsg === 'Token expirado') {
      Cookie.remove('user_token');
      Cookie.remove('user_role');
      toast.error('Faça login novamente, suas credenciais expiraram!');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);