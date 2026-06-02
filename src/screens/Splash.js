import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GREEN, GREEN_LIGHT } from '../constants';
import { initClientURL } from '../api/client';

export default function Splash({ navigation }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Initialize backend IP client config
        await initClientURL();
        
        // Wait 1.5 seconds for visual branding impression
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const token = await AsyncStorage.getItem('auth_token');
        const role = await AsyncStorage.getItem('user_role');
        const profileSetup = await AsyncStorage.getItem('profile_setup');
        
        if (token && role) {
          if (profileSetup === 'done') {
            navigation.replace(role === 'farmer' ? 'Farmer' : 'Buyer');
          } else {
            navigation.replace('Signup');
          }
        } else {
          // If they already set the language, go to Role Selection
          const savedLang = await AsyncStorage.getItem('user_lang');
          if (savedLang) {
            navigation.replace('Role');
          } else {
            navigation.replace('Lang');
          }
        }
      } catch (e) {
        console.log('Error verifying auth credentials', e);
        navigation.replace('Lang');
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐟</Text>
      <Text style={styles.title}>AquaSetu</Text>
      <Text style={styles.subtitle}>weighbridge assistant</Text>
      <ActivityIndicator size="small" color="#ffffff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: GREEN_LIGHT,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  loader: {
    marginTop: 32,
  },
});
