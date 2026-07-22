import axios from 'axios';

class ApiClient {
  constructor() {
    this.http = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      withCredentials: true,
    });
    this.attachAuthInterceptor();
  }

  attachAuthInterceptor() {
    this.http.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  get(url, params) {
    return this.http.get(url, { params }).then((r) => r.data);
  }

  post(url, body) {
    return this.http.post(url, body).then((r) => r.data);
  }

  put(url, body) {
    return this.http.put(url, body).then((r) => r.data);
  }

  delete(url) {
    return this.http.delete(url).then((r) => r.data);
  }
}

export default new ApiClient();