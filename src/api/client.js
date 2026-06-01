import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default development URL (standard Django port on machine)
// Change this to your computer's local network IP (e.g. 'http://192.168.1.100:8000/api') to test on physical device!
let BACKEND_IP = '192.168.1.7'; // Fallback / placeholder IP
let BASE_URL = `http://${BACKEND_IP}:8000/api`;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

// Method to set backend IP dynamically
export const setBackendIP = async (ip) => {
  if (!ip) return;
  const cleanIp = ip.trim();
  await AsyncStorage.setItem('backend_ip', cleanIp);
  client.defaults.baseURL = `http://${cleanIp}:8000/api`;
  return client.defaults.baseURL;
};

// Initialize base URL from storage
export const initClientURL = async () => {
  try {
    const savedIp = await AsyncStorage.getItem('backend_ip');
    if (savedIp) {
      client.defaults.baseURL = `http://${savedIp}:8000/api`;
    }
  } catch (e) {
    console.log('Error initializing client URL', e);
  }
  return client.defaults.baseURL;
};

export default client;
