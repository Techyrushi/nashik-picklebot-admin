import axios from 'axios';
import { APIURL } from '@/config/const';

const axiosInstance = axios.create({
  baseURL: APIURL,
});

// Add an interceptor to include the Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
