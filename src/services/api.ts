import axios from "axios";
import Cookie from "js-cookie";

export const api = axios.create({
  baseURL: "http://localhost:8080",
});

// 1. Interceptor de REQUEST: Envia o token para o servidor
api.interceptors.request.use(
  (config) => {
    const token = Cookie.get("user_token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Interceptor de RESPONSE: Trata erros que voltam do servidor (como 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido - Limpa tudo e desloga
      Cookie.remove("user_token");
      Cookie.remove("user_role");
      Cookie.remove("user_id");

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);