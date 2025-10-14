import axios from "axios";
import { APIURL } from '@/config/const'
const api = axios.create({ baseURL: APIURL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
