import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Railway Backend URL
const BASE_URL = 'https://aqua2-production.up.railway.app/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Request interceptor to attach JWT Token
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Error reading auth token', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dummy stubs for backward compatibility with existing screen files
export const setBackendIP = async (ip) => {
  return BASE_URL;
};

export const initClientURL = async () => {
  return BASE_URL;
};

export default client;


