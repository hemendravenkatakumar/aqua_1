import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default development URL (standard Django port on machine)
let BACKEND_IP = '192.168.1.7'; 
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

// Helper function to format input IP or Domain into a clean Base API URL
const formatBaseURL = (input) => {
  if (!input) return BASE_URL;
  const clean = input.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean.endsWith('/') ? `${clean}api` : `${clean}/api`;
  }
  // Check if it looks like a domain name (contains . and no port)
  if (clean.includes('.') && !clean.includes(':') && isNaN(clean.replace(/\./g, ''))) {
    return `https://${clean}/api`;
  }
  // Fallback to local development port
  return `http://${clean}:8000/api`;
};

// Method to set backend IP dynamically
export const setBackendIP = async (ip) => {
  if (!ip) return;
  const targetUrl = formatBaseURL(ip);
  await AsyncStorage.setItem('backend_ip', ip.trim());
  client.defaults.baseURL = targetUrl;
  return client.defaults.baseURL;
};

// Initialize base URL from storage
export const initClientURL = async () => {
  try {
    const savedIp = await AsyncStorage.getItem('backend_ip');
    if (savedIp) {
      client.defaults.baseURL = formatBaseURL(savedIp);
    }
  } catch (e) {
    console.log('Error initializing client URL', e);
  }
  return client.defaults.baseURL;
};

export default client;

